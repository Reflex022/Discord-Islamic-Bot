
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { safeReply } = require('../utils/discordHelpers');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('توقف_الدعاء')
        .setDescription('إيقاف إرسال الأدعية'),

    async execute(interaction, client) {
        const guildId = interaction.guildId;
        const activeDua = client.activeDuas.get(guildId);

        if (!activeDua) {
            return safeReply(interaction, {
                content: ' لا يوجد أدعية نشطة حالياً',
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            clearInterval(activeDua.interval);
            client.activeDuas.delete(guildId);

            await safeReply(interaction, {
                content: '⏹ تم إيقاف إرسال الأدعية بنجاح',
                flags: MessageFlags.Ephemeral
            });

            logger.info('Duas stopped', guildId);

        } catch (error) {
            logger.error('Error stopping duas', guildId, {
                error: error.message,
                stack: error.stack
            });
            await safeReply(interaction, {
                content: ' حدث خطأ أثناء إيقاف الأدعية',
                flags: MessageFlags.Ephemeral
            });
        }
    },
};
