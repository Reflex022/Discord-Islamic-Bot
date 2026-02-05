

const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const logger = require('../../utils/logger');
const { saveState } = require('./stateManager');

/**
 * @param {Client} client 
 * @param {string} guildId 
 * @param {string} channelId 
 * @param {Object} connectionInfo 
 * @param {string} reason 
 * @returns {Promise<boolean>} 
 */
async function reconnectToVoiceChannel(client, guildId, channelId, connectionInfo, reason = 'مجهول') {
    try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return false;

        const channel = guild.channels.cache.get(channelId);
        if (!channel) return false;

        logger.info('Attempting reconnection', guildId, {
            channelId,
            reason
        });

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        connection.subscribe(player);

        connectionInfo.connection = connection;
        connectionInfo.player = player;

        connection.on('error', (error) => {
            logger.error('Voice connection error', guildId, {
                error: error.message,
                channelId
            });
            saveState(client);
        });

        connection.on('disconnected', () => {
            saveState(client);
        });

        if (connectionInfo.audioFile || connectionInfo.streamUrl) {
            const audioSource = connectionInfo.audioFile || connectionInfo.streamUrl;
            try {
                const resource = createAudioResource(audioSource, {
                    inputType: 'arbitrary',
                    inlineVolume: true
                });
                player.play(resource);
            } catch (error) {
                logger.error('Audio restart error', guildId, {
                    error: error.message,
                    audioSource: audioSource
                });
            }
        }

        saveState(client);

        logger.info('Reconnection successful', guildId, {
            channelId,
            reason
        });

        return true;

    } catch (error) {
        logger.error('Reconnection error', guildId, {
            error: error.message,
            stack: error.stack,
            channelId
        });
        return false;
    }
}

module.exports = {
    reconnectToVoiceChannel
};
