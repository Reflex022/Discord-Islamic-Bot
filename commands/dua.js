
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const logger = require('../utils/logger');
const { safeReply, safeSend } = require('../utils/discordHelpers');
const { sendDua } = require('../src/services/schedulerService');
const Validator = require('../utils/validator');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('دعاء')
        .setDescription('إرسال أدعية بشكل دوري')
        .addIntegerOption(option =>
            option.setName('المدة')
                .setDescription('المدة بالدقائق (من 30 دقيقة إلى 6 ساعات)')
                .setRequired(true)
                .setMinValue(30)
                .setMaxValue(360)
        ),

    async execute(interaction, client) {
        const duration = interaction.options.getInteger('المدة');
        const channelId = interaction.channelId;
        const guildId = interaction.guildId;

        const durationCheck = Validator.validateDuration(duration);
        if (!durationCheck.valid) {
            return safeReply(interaction, {
                content: `❌ ${durationCheck.error}`,
                flags: MessageFlags.Ephemeral
            });
        }

        if (client.activeDuas.has(guildId)) {
            return safeReply(interaction, {
                content: 'يوجد بالفعل أدعية نشطة في هذا السيرفر. استخدم `/توقف_الدعاء` أولاً',
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            const startEmbed = {
                title: 'تم بدء خدمة الأدعية بنجاح',
                description: `**سيتم إرسال الأدعية بشكل مستمر (دعاء كل ${duration} دقيقة)**\n**استخدم \`/توقف_الدعاء\` للإيقاف**`,
                color: 0x3498DB,
                fields: [
                    {
                        name: '⏰ معدل الإرسال',
                        value: `دعاء كل ${duration} دقيقة`,
                        inline: true
                    }
                ],
                footer: {
                    text: '✨ بوت الأذكار والأدعية • تقبل الله دعاءكم'
                },
                timestamp: new Date().toISOString()
            };

            await safeReply(interaction, {
                embeds: [startEmbed],
                flags: MessageFlags.Ephemeral
            });

            await sendDua(client, guildId, channelId);

            const interval = setInterval(() => sendDua(client, guildId, channelId), duration * 60000);

            client.activeDuas.set(guildId, {
                interval: interval,
                channelId: channelId,
                startTime: Date.now(),
                duration: duration * 60000
            });

            logger.info('Duas service started', guildId, {
                channelId,
                duration: duration,
                intervalMs: duration * 60000
            });

        } catch (error) {
            logger.error('Error starting duas service', guildId, {
                error: error.message,
                stack: error.stack
            });

            await safeReply(interaction, {
                content: 'حدث خطأ في تحميل بيانات الأدعية',
                flags: MessageFlags.Ephemeral
            });
        }
    },
};
