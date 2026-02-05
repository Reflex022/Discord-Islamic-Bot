
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { safeReply } = require('../utils/discordHelpers');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('توقف_الاذكار')
        .setDescription('إيقاف إرسال الأذكار'),

    async execute(interaction, client) {
        const guildId = interaction.guildId;
        const activeZikr = client.activeAzkar.get(guildId);

        if (!activeZikr) {
            return safeReply(interaction, {
                content: ' لا يوجد أذكار نشطة حالياً',
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            clearInterval(activeZikr.interval);
            client.activeAzkar.delete(guildId);

            await safeReply(interaction, {
                content: '⏹️ تم إيقاف إرسال الأذكار بنجاح',
                flags: MessageFlags.Ephemeral
            });

            logger.info('Azkar stopped', guildId);

        } catch (error) {
            logger.error('Error stopping azkar', guildId, {
                error: error.message,
                stack: error.stack
            });
            await safeReply(interaction, {
                content: ' حدث خطأ أثناء إيقاف الأذكار',
                flags: MessageFlags.Ephemeral
            });
        }
    },
};
