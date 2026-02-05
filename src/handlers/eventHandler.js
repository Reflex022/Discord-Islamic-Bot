const { VoiceConnectionStatus } = require('@discordjs/voice');
const logger = require('../../utils/logger');
const { safeReply } = require('../../utils/discordHelpers');
const { saveState, clearState } = require('../services/stateManager');
const { reconnectToVoiceChannel } = require('../services/reconnectionService');
const { cleanupOldData } = require('../services/dataManager');
const { deployCommands } = require('../services/commandDeployment');

/**
 * @param {Client} client 
 */
function registerEvents(client) {
    client.once('clientReady', async () => {
        console.log('\n' + '='.repeat(50));
        console.log('🕌 Discord Islamic Bot');
        console.log('='.repeat(50));
        console.log(`✅ البوت يعمل الآن | Bot is now running`);
        console.log(`👤 اسم البوت | Bot Name: ${client.user.tag}`);
        console.log('='.repeat(50) + '\n');
        
        logger.info('✅ تم تشغيل البوت بنجاح - Bot is Ready', null, {
            tag: client.user.tag,
            guilds: client.guilds.cache.size
        });

        logger.info('Auto-deploying slash commands...');
        const deployed = await deployCommands(client);
        if (deployed) {
            logger.info('✅ Slash commands refreshed successfully');
        } else {
            logger.warn('⚠️ Failed to refresh slash commands');
        }

        const saveInterval = setInterval(() => {
            saveState(client);
        }, 60 * 1000);
        client.systemIntervals.push(saveInterval);

        setTimeout(async () => {
            const { restoreState } = require('../services/stateManager');
            await restoreState(client);
            saveState(client);
        }, 3000);

        const connectionCheckInterval = setInterval(async () => {
            let needsSave = false;

            for (const [guildId, connectionInfo] of client.voiceConnections) {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) {
                    client.voiceConnections.delete(guildId);
                    needsSave = true;
                    continue;
                }

                const channel = guild.channels.cache.get(connectionInfo.channelId);
                if (!channel) {
                    client.voiceConnections.delete(guildId);
                    needsSave = true;
                    continue;
                }

                const botVoiceState = guild.members.me?.voice;
                if (!botVoiceState?.channelId || botVoiceState.channelId !== connectionInfo.channelId) {
                    await reconnectToVoiceChannel(client, guildId, connectionInfo.channelId, connectionInfo, 'فحص دوري - البوت خارج الروم');
                    needsSave = true;
                }
            }

            if (needsSave) {
                saveState(client);
            }
        }, 60 * 1000);
        client.systemIntervals.push(connectionCheckInterval);

        const cleanupInterval = setInterval(() => {
            cleanupOldData(client);

            if (client.connectionPool) {
                client.connectionPool.cleanupInactive();
            }

            if (client.resourceManager) {
                client.resourceManager.fullCleanup();
            }
        }, client.config?.CLEANUP_INTERVAL_MS || 15 * 60 * 1000);
        client.systemIntervals.push(cleanupInterval);

        const memoryMonitorInterval = setInterval(() => {
            if (client.resourceManager) {
                const health = client.resourceManager.healthCheck();

                if (health.status === 'critical') {
                    logger.error('استخدام الذاكرة حرج', null, health.details.memory);
                } else if (health.status === 'warning') {
                    logger.warn('استخدام الذاكرة مرتفع', null, health.details.memory);
                }
            }
        }, client.config?.MEMORY_CHECK_INTERVAL_MS || 60000);
        client.systemIntervals.push(memoryMonitorInterval);

        client.voiceConnections.forEach((connectionInfo, guildId) => {
            if (connectionInfo.connection) {
                connectionInfo.connection.on('error', (error) => {
                    logger.error('Voice connection error', guildId, {
                        error: error.message,
                        channelId: connectionInfo.channelId
                    });
                    saveState(client);
                    setTimeout(async () => {
                        await reconnectToVoiceChannel(client, guildId, connectionInfo.channelId, connectionInfo, 'Connection error');
                    }, 2000);
                });

                connectionInfo.connection.on('disconnected', () => {
                    saveState(client);
                });
            }
        });

        const voiceMonitorInterval = setInterval(async () => {
            for (const [guildId, connectionInfo] of client.voiceConnections) {
                if (!connectionInfo || !connectionInfo.connection) continue;

                const connection = connectionInfo.connection;

                if (connection.state.status === VoiceConnectionStatus.Disconnected ||
                    connection.state.status === VoiceConnectionStatus.Destroyed) {

                    await reconnectToVoiceChannel(client, guildId, connectionInfo.channelId, connectionInfo, 'فحص دوري - انقطاع الاتصال');
                }
            }
        }, 30000);
        client.systemIntervals.push(voiceMonitorInterval);
    });

    client.on('voiceStateUpdate', async (oldState, newState) => {
        if (oldState.member?.user.id !== client.user.id) return;

        const guildId = oldState.guild.id;
        const connectionInfo = client.voiceConnections.get(guildId);

        if (!connectionInfo) return;

        if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
            if (connectionInfo.channelId && connectionInfo.channelId !== newState.channelId) {
                const tryReconnect = async () => {
                    try {
                        await reconnectToVoiceChannel(client, guildId, connectionInfo.channelId, connectionInfo, 'تم سحب البوت لروم آخر');
                    } catch (error) {
                        logger.error('Failed to reconnect after move', guildId, {
                            error: error.message
                        });
                    }
                };

                setTimeout(tryReconnect, 2000);
            }
        }
    });

    client.on('interactionCreate', async interaction => {

        if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName);
            if (!command || !command.autocomplete) return;

            try {
                await command.autocomplete(interaction);
            } catch (error) {
                logger.error('Error in autocomplete', interaction.guildId, {
                    commandName: interaction.commandName,
                    error: error.message
                });
            }
            return;
        }

        if (!interaction.isChatInputCommand()) return;

        if (!interaction.member.permissions.has('Administrator')) {

            return safeReply(interaction, {
                content: '❌ هذا الأمر متاح فقط للمديرين',
                flags: 64
            });
        }

        if (client.rateLimiter) {
            const rateCheck = client.rateLimiter.check(interaction.user.id);
            if (rateCheck.limited) {
                return safeReply(interaction, {
                    content: `⏳ لقد تجاوزت حد الطلبات، انتظر ${rateCheck.retryAfter} ثانية`,
                    flags: 64
                });
            }
        }

        const cooldownKey = `${interaction.guildId}-${interaction.user.id}`;
        const now = Date.now();
        const cooldownTime = client.config?.COMMAND_COOLDOWN_MS || 3000;

        if (client.commandCooldowns.has(cooldownKey)) {
            const lastUsed = client.commandCooldowns.get(cooldownKey);
            const remaining = cooldownTime - (now - lastUsed);

            if (remaining > 0) {
                return safeReply(interaction, {
                    content: `⏳ انتظر ${Math.ceil(remaining / 1000)} ثانية قبل استخدام أمر آخر`,
                    flags: 64
                });
            }
        }
        client.commandCooldowns.set(cooldownKey, now);

        if (client.commandCooldowns.size > 1000) {
            const cutoff = now - cooldownTime;
            client.commandCooldowns.forEach((timestamp, key) => {
                if (timestamp < cutoff) client.commandCooldowns.delete(key);
            });
        }

        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction, client);

            if (interaction.commandName === 'توقف') {
                clearState();
            } else {
                saveState(client);
            }
        } catch (error) {
            logger.error('Error executing command', interaction.guildId, {
                commandName: interaction.commandName,
                error: error.message,
                stack: error.stack
            });

            try {
                if (!interaction.replied && !interaction.deferred) {
                    await safeReply(interaction, {
                        content: '❌ حدث خطأ أثناء تنفيذ الأمر',
                        flags: 64
                    });
                }
            } catch (replyError) {
                logger.error('Error sending error message', interaction.guildId, {
                    error: replyError.message
                });
            }
        }
    });

    client.on('guildCreate', (guild) => {
        logger.info('انضمام لسيرفر جديد', guild.id, {
            guildName: guild.name,
            totalGuilds: client.guilds.cache.size
        });
    });

    client.on('guildDelete', (guild) => {
        logger.info('تم مغادرة سيرفر', guild.id, {
            guildName: guild.name,
            remainingGuilds: client.guilds.cache.size
        });

        if (client.resourceManager) {
            client.resourceManager.cleanupGuild(guild.id);
        } else {
            client.voiceConnections.delete(guild.id);
            client.activeAzkar.delete(guild.id);
            client.activeDuas.delete(guild.id);
            client.recentAzkar.delete(guild.id);
            client.recentDuas.delete(guild.id);
        }
    });
}

module.exports = {
    registerEvents
};
