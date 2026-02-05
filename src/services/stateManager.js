

const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');
const { saveJSONFile } = require('../../utils/discordHelpers');
const { sendZikr, sendDua } = require('./schedulerService');

const storageDir = path.join(__dirname, '..', 'storage');
const stateFilePath = path.join(storageDir, 'botState.json');

if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
}

/**
 * @param {Client} client 
 * @returns {boolean} 
 */
function saveState(client) {
    try {
        const simpleState = {
            connections: [],
            azkar: [],
            duas: [],
            recentAzkar: [],
            recentDuas: []
        };

        client.voiceConnections.forEach((info, guildId) => {
            if (info) {
                const channelId = info.channelId ||
                    (info.connection && info.connection.joinConfig ?
                        info.connection.joinConfig.channelId : null);

                if (channelId) {
                    const connectionData = {
                        guildId,
                        channelId: channelId,
                        type: info.type || 'قرآن',
                        audioFile: info.audioFile || info.streamUrl || null,
                        radioName: info.radioName || null
                    };

                    if (info.isMP3Quran) {
                        connectionData.isMP3Quran = true;
                        connectionData.currentSurahIndex = info.currentSurahIndex || 0;
                    }

                    simpleState.connections.push(connectionData);
                }
            }
        });

        client.activeAzkar.forEach((info, guildId) => {
            if (info && info.channelId) {
                simpleState.azkar.push({
                    guildId,
                    channelId: info.channelId,
                    interval: info.interval ? true : false,
                    duration: info.duration || 3600000,
                    startTime: info.startTime || Date.now()
                });
            }
        });

        client.activeDuas.forEach((info, guildId) => {
            if (info && info.channelId) {
                simpleState.duas.push({
                    guildId,
                    channelId: info.channelId,
                    interval: info.interval ? true : false,
                    duration: info.duration || 3600000,
                    startTime: info.startTime || Date.now()
                });
            }
        });

        client.recentAzkar.forEach((recentList, guildId) => {
            if (recentList && recentList.length > 0) {
                simpleState.recentAzkar.push({
                    guildId,
                    usedItems: recentList
                });
            }
        });

        client.recentDuas.forEach((recentList, guildId) => {
            if (recentList && recentList.length > 0) {
                simpleState.recentDuas.push({
                    guildId,
                    usedItems: recentList
                });
            }
        });

        const success = saveJSONFile(stateFilePath, simpleState);

        if (success) {
            logger.debug('State saved successfully', null, {
                connections: simpleState.connections.length,
                azkar: simpleState.azkar.length,
                duas: simpleState.duas.length
            });
        }

        return success;

    } catch (error) {
        logger.error('Error saving state', null, {
            error: error.message,
            stack: error.stack
        });
        return false;
    }
}


function clearState() {
    try {
        if (fs.existsSync(stateFilePath)) {
            fs.unlinkSync(stateFilePath);
        }
    } catch (error) {
        logger.error('Error clearing state file', null, {
            error: error.message,
            filePath: stateFilePath
        });
    }
}

/**
 * @param {Client} client 
 */
async function restoreState(client) {
    if (!fs.existsSync(stateFilePath)) return;

    try {
        const data = fs.readFileSync(stateFilePath, 'utf8');
        const simpleState = JSON.parse(data);

        const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');

        for (const conn of simpleState.connections) {
            const guild = client.guilds.cache.get(conn.guildId);
            if (!guild) continue;

            const channel = guild.channels.cache.get(conn.channelId);
            if (!channel) continue;

            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator,
            });

            const player = createAudioPlayer();
            connection.subscribe(player);

            connection.on('error', (error) => {
                logger.error('Voice connection error (restored)', conn.guildId, {
                    error: error.message,
                    channelId: conn.channelId
                });
                saveState(client);
            });

            connection.on('disconnected', () => {
                saveState(client);
            });

            const connectionInfo = {
                connection: connection,
                player: player,
                channelId: channel.id,
                streamUrl: conn.audioFile || conn.streamUrl,
                audioFile: conn.audioFile,
                type: conn.type || 'قرآن',
                radioName: conn.radioName,
                rejoin: true
            };

            if (conn.isMP3Quran) {
                connectionInfo.isMP3Quran = true;
                connectionInfo.currentSurahIndex = conn.currentSurahIndex || 0;
                connectionInfo.quranData = client.data.quran[0];

                player.on(AudioPlayerStatus.Idle, () => {
                    const voiceInfo = client.voiceConnections.get(conn.guildId);
                    if (voiceInfo && voiceInfo.isMP3Quran) {
                        voiceInfo.currentSurahIndex = (voiceInfo.currentSurahIndex + 1) % voiceInfo.quranData.audio.length;

                        setTimeout(() => {
                            try {
                                const nextSurah = voiceInfo.quranData.audio[voiceInfo.currentSurahIndex];
                                const nextResource = createAudioResource(nextSurah.link, {
                                    inputType: 'arbitrary',
                                    inlineVolume: true
                                });
                                player.play(nextResource);
                                voiceInfo.streamUrl = nextSurah.link;
                                voiceInfo.audioFile = nextSurah.link;
                            } catch (error) {
                                logger.error('Error playing next surah', conn.guildId, {
                                    error: error.message,
                                    surahIndex: voiceInfo.currentSurahIndex
                                });
                            }
                        }, 2000);
                    }
                });

                const currentSurah = connectionInfo.quranData.audio[connectionInfo.currentSurahIndex];
                const resource = createAudioResource(currentSurah.link, {
                    inputType: 'arbitrary',
                    inlineVolume: true
                });
                player.play(resource);
            } else if (conn.audioFile || conn.streamUrl) {
                try {
                    const audioSource = conn.audioFile || conn.streamUrl;
                    const resource = createAudioResource(audioSource, {
                        inputType: 'arbitrary',
                        inlineVolume: true
                    });
                    player.play(resource);
                } catch (error) {
                    logger.error('Playback error', conn.guildId, {
                        error: error.message,
                        stack: error.stack
                    });
                }
            }

            client.voiceConnections.set(conn.guildId, connectionInfo);
        }

        for (const azkarEntry of simpleState.recentAzkar) {
            client.recentAzkar.set(azkarEntry.guildId, azkarEntry.usedItems);
        }
        for (const duaEntry of simpleState.recentDuas) {
            client.recentDuas.set(duaEntry.guildId, duaEntry.usedItems);
        }

        logger.info('State restored successfully', null, {
            connections: simpleState.connections.length,
            azkar: simpleState.azkar.length,
            duas: simpleState.duas.length
        });

        for (const azkarInfo of simpleState.azkar) {
            const guild = client.guilds.cache.get(azkarInfo.guildId);
            if (!guild) continue;

            const channel = guild.channels.cache.get(azkarInfo.channelId);
            if (!channel) continue;

            if (azkarInfo.interval) {
                const duration = azkarInfo.duration || 3600000;

                const interval = setInterval(() => sendZikr(client, azkarInfo.guildId, azkarInfo.channelId), duration);

                client.activeAzkar.set(azkarInfo.guildId, {
                    interval: interval,
                    channelId: azkarInfo.channelId,
                    startTime: azkarInfo.startTime || Date.now(),
                    duration: duration
                });

                logger.info('Restored azkar service', azkarInfo.guildId);
            }
        }

        for (const duaInfo of simpleState.duas) {
            const guild = client.guilds.cache.get(duaInfo.guildId);
            if (!guild) continue;

            const channel = guild.channels.cache.get(duaInfo.channelId);
            if (!channel) continue;

            if (duaInfo.interval) {
                const duration = duaInfo.duration || 3600000;

                const interval = setInterval(() => sendDua(client, duaInfo.guildId, duaInfo.channelId), duration);

                client.activeDuas.set(duaInfo.guildId, {
                    interval: interval,
                    channelId: duaInfo.channelId,
                    startTime: duaInfo.startTime || Date.now(),
                    duration: duration
                });

                logger.info('Restored dua service', duaInfo.guildId);
            }
        }

    } catch (error) {
        logger.error('Error restoring state', null, {
            error: error.message,
            stack: error.stack
        });
    }
}

module.exports = {
    saveState,
    clearState,
    restoreState
};
