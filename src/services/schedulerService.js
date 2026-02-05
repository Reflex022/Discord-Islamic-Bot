const logger = require('../../utils/logger');
const { safeSend } = require('../../utils/discordHelpers');

async function sendZikr(client, guildId, channelId) {
    try {
        const azkarData = client.data.azkar;

        if (!azkarData || azkarData.length === 0) {
            logger.error('Azkar data is empty or invalid', guildId);
            const activeInfo = client.activeAzkar.get(guildId);
            if (activeInfo && activeInfo.interval) {
                clearInterval(activeInfo.interval);
            }
            client.activeAzkar.delete(guildId);
            return;
        }

        const randomZikr = client.getAvailableZikr(azkarData, guildId);
        client.markZikrAsUsed(randomZikr.id, guildId);

        const embed = {
            title: 'ذكر اليوم',
            description: `# ${randomZikr.text}`,
            color: 0x2ECC71,
            fields: [
                {
                    name: 'عدد المرات',
                    value: `**${randomZikr.count}**`,
                    inline: true
                },
                {
                    name: 'التصنيف',
                    value: `**${randomZikr.category}**`,
                    inline: true
                }
            ],
            footer: {
                text: 'بوت الأذكار والأدعية • جعله الله في ميزان حسناتكم'
            },
            timestamp: new Date().toISOString()
        };

        if (randomZikr.description) {
            embed.fields.push({
                name: 'السياق / الفضل',
                value: randomZikr.description,
                inline: false
            });
        }

        const channel = client.channels.cache.get(channelId);
        if (!channel) {
            logger.error('Channel not found for azkar', guildId, { channelId });
            const activeInfo = client.activeAzkar.get(guildId);
            if (activeInfo && activeInfo.interval) {
                clearInterval(activeInfo.interval);
            }
            client.activeAzkar.delete(guildId);
            return;
        }

        const message = await safeSend(channel, { embeds: [embed] });

        if (!message) {
            logger.warn('Failed to send zikr (permissions issue?)', guildId, { channelId });
        }

    } catch (error) {
        logger.error('Error in azkar interval', guildId, {
            error: error.message,
            stack: error.stack,
            channelId
        });

        if (error.message.includes('Channel') || error.message.includes('Permission')) {
            const activeInfo = client.activeAzkar.get(guildId);
            if (activeInfo && activeInfo.interval) {
                clearInterval(activeInfo.interval);
            }
            client.activeAzkar.delete(guildId);
        }
    }
}

async function sendDua(client, guildId, channelId) {
    try {
        const duaData = client.data.duas;

        if (!duaData || duaData.length === 0) {
            logger.error('Dua data is empty or invalid', guildId);
            const activeInfo = client.activeDuas.get(guildId);
            if (activeInfo && activeInfo.interval) {
                clearInterval(activeInfo.interval);
            }
            client.activeDuas.delete(guildId);
            return;
        }

        const randomDua = client.getAvailableDua(duaData, guildId);
        client.markDuaAsUsed(randomDua.id, guildId);

        const embed = {
            title: 'دعاء اليوم',
            description: `# ${randomDua.dua}`,
            color: 0x3498DB,
            fields: [
                {
                    name: 'المصدر',
                    value: `**${randomDua.source}**`,
                    inline: true
                },
                {
                    name: 'التصنيف',
                    value: `**${randomDua.category}**`,
                    inline: true
                },
                {
                    name: 'السياق',
                    value: `${randomDua.context}`,
                    inline: false
                }
            ],
            footer: {
                text: '🤲 أدعية المؤمنين • بوت الأذكار والأدعية'
            },
            timestamp: new Date().toISOString()
        };

        const channel = client.channels.cache.get(channelId);
        if (!channel) {
            logger.error('Channel not found for duas', guildId, { channelId });
            const activeInfo = client.activeDuas.get(guildId);
            if (activeInfo && activeInfo.interval) {
                clearInterval(activeInfo.interval);
            }
            client.activeDuas.delete(guildId);
            return;
        }

        const message = await safeSend(channel, { embeds: [embed] });

        if (message) {
            logger.info('Dua sent successfully', guildId, {
                duaId: randomDua.id,
                channelId
            });
        } else {
            logger.warn('Failed to send dua (permissions issue?)', guildId, { channelId });
        }

    } catch (error) {
        logger.error('Error in duas interval', guildId, {
            error: error.message,
            stack: error.stack,
            channelId
        });

        if (error.message.includes('Channel') || error.message.includes('Permission')) {
            const activeInfo = client.activeDuas.get(guildId);
            if (activeInfo && activeInfo.interval) {
                clearInterval(activeInfo.interval);
            }
            client.activeDuas.delete(guildId);
            logger.warn('Duas interval stopped due to critical error', guildId);
        }
    }
}

module.exports = {
    sendZikr,
    sendDua
};
