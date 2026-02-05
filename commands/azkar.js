
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const logger = require('../utils/logger');
const { safeReply, safeSend } = require('../utils/discordHelpers');
const { sendZikr } = require('../src/services/schedulerService');
const Validator = require('../utils/validator');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('اذكار')
        .setDescription('إرسال أذكار بشكل دوري')
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

        if (client.activeAzkar.has(guildId)) {
            return safeReply(interaction, {
                content: 'يوجد بالفعل أذكار نشطة في هذا السيرفر. استخدم `/توقف_الاذكار` أولاً',
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            const startEmbed = {
                title: 'تم بدء خدمة ارسال الأذكار بنجاح',
                description: `**سيتم إرسال الأذكار بشكل مستمر (ذكر كل ${duration} دقيقة)**\n**استخدم \`/توقف_الاذكار\` للإيقاف**`,
                color: 0x27AE60,
                fields: [
                    {
                        name: 'معدل الإرسال',
                        value: `ذكر كل ${duration} دقيقة`,
                        inline: true
                    }
                ],
                footer: {
                    text: 'بوت الأذكار والأدعية • جعله الله في ميزان حسناتكم'
                },
                timestamp: new Date().toISOString()
            };

            await safeReply(interaction, {
                embeds: [startEmbed],
                flags: MessageFlags.Ephemeral
            });


            await sendZikr(client, guildId, channelId);

            const interval = setInterval(() => sendZikr(client, guildId, channelId), duration * 60000);

            client.activeAzkar.set(guildId, {
                interval: interval,
                channelId: channelId,
                startTime: Date.now(),
                duration: duration * 60000
            });

        } catch (error) {
            logger.error('Error starting azkar service', guildId, {
                error: error.message,
                stack: error.stack
            });

            await safeReply(interaction, {
                content: 'حدث خطأ في تحميل بيانات الأذكار',
                flags: MessageFlags.Ephemeral
            });
        }
    },
};
