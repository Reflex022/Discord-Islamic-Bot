
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { safeReply } = require('../utils/discordHelpers');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('توقف')
        .setDescription('إيقاف تشغيل إذاعة القرآن الكريم'),

    async execute(interaction, client) {
        const connection = client.voiceConnections.get(interaction.guildId);

        if (!connection) {
            return safeReply(interaction, {
                content: 'لا يوجد بث نشط حالياً',
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            connection.rejoin = false;

            if (connection.player) {
                connection.player.stop();
            }

            if (connection.connection) {
                connection.connection.destroy();
            }
            client.voiceConnections.delete(interaction.guildId);

            await safeReply(interaction, {
                content: ' تم إيقاف البث بنجاح',
                flags: MessageFlags.Ephemeral
            });

            logger.info('Radio stopped', interaction.guildId);

        } catch (error) {
            logger.error('Error stopping radio', interaction.guildId, {
                error: error.message,
                stack: error.stack
            });
            await safeReply(interaction, {
                content: 'حدث خطأ أثناء إيقاف البث',
                flags: MessageFlags.Ephemeral
            });
        }
    },
};
