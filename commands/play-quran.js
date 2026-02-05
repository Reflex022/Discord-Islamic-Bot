
const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, MessageFlags } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const logger = require('../utils/logger');
const Validator = require('../utils/validator');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('تشغيل_قران')
        .setDescription('تشغيل إذاعة القرآن الكريم'),

    async execute(interaction, client) {
        const voiceCheck = Validator.validateVoiceChannel(interaction.member.voice.channel);
        if (!voiceCheck.valid) {
            return interaction.reply({
                content: `❌ ${voiceCheck.error}`,
                flags: MessageFlags.Ephemeral
            });
        }

        const select = new StringSelectMenuBuilder()
            .setCustomId('quran_radio_select')
            .setPlaceholder('اختر إذاعة القرآن الكريم')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('إذاعة القرآن الكريم من القاهرة')
                    .setValue('cairo')
                    .setEmoji('🕌'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('إذاعة القرآن الكريم من السعودية')
                    .setValue('saudi')
                    .setEmoji('🕋'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('القرآن الكريم كاملاً - أحمد الحواشي')
                    .setValue('mp3_quran')
                    .setEmoji('📖')
            );

        const row = new ActionRowBuilder()
            .addComponents(select);

        const response = await interaction.reply({
            content: '📻 اختر إذاعة القرآن الكريم:',
            components: [row],
            flags: MessageFlags.Ephemeral
        });

        const collector = response.createMessageComponentCollector({
            time: 300000
        });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({
                    content: 'لا يمكنك استخدام هذا الخيار',
                    flags: MessageFlags.Ephemeral
                });
            }

            let streamUrl;
            let radioName;
            let isMP3Quran = false;

            if (i.values[0] === 'cairo') {
                streamUrl = 'https://stream.radiojar.com/8s5u5tpdtwzuv';
                radioName = 'إذاعة القرآن الكريم من القاهرة';
            } else if (i.values[0] === 'saudi') {
                const saudiUrls = [
                    'http://www.quran-radio.org:8002/',
                ];
                streamUrl = saudiUrls[0];
                radioName = 'إذاعة القرآن الكريم من السعودية';
            } else if (i.values[0] === 'mp3_quran') {
                isMP3Quran = true;
                radioName = 'القرآن الكريم كاملاً - أحمد الحواشي';
            }

            try {
                let connection;
                const existingConnection = client.voiceConnections.get(interaction.guildId);

                if (existingConnection && existingConnection.connection) {
                    connection = existingConnection.connection;
                    logger.debug('Reusing existing connection', interaction.guildId);
                } else {
                    connection = joinVoiceChannel({
                        channelId: interaction.member.voice.channel.id,
                        guildId: interaction.guildId,
                        adapterCreator: interaction.guild.voiceAdapterCreator,
                    });
                }

                const player = createAudioPlayer();

                if (isMP3Quran) {
                    const mp3QuranData = client.data.quran;
                    const quranReader = mp3QuranData[0];

                    let currentSurahIndex = 0;

                    const playCurrentSurah = () => {
                        const currentSurah = quranReader.audio[currentSurahIndex];

                        const resource = createAudioResource(currentSurah.link, {
                            inputType: 'arbitrary',
                            inlineVolume: true
                        });

                        player.play(resource);
                        return currentSurah;
                    };

                    const firstSurah = playCurrentSurah();
                    streamUrl = firstSurah.link;

                    client.voiceConnections.set(interaction.guildId, {
                        connection: connection,
                        player: player,
                        channelId: interaction.member.voice.channel.id,
                        streamUrl: firstSurah.link,
                        audioFile: firstSurah.link,
                        type: 'قرآن',
                        radioName: radioName,
                        isMP3Quran: true,
                        quranData: quranReader,
                        currentSurahIndex: currentSurahIndex,
                        rejoin: true
                    });

                    player.on(AudioPlayerStatus.Idle, () => {
                        const voiceInfo = client.voiceConnections.get(interaction.guildId);
                        if (voiceInfo && voiceInfo.isMP3Quran) {
                            voiceInfo.currentSurahIndex = (voiceInfo.currentSurahIndex + 1) % 114;

                            const nextSurah = voiceInfo.quranData.audio[voiceInfo.currentSurahIndex];

                            if (typeof client.saveCurrentState === 'function') {
                                client.saveCurrentState();
                            }

                            setTimeout(() => {
                                try {
                                    const nextResource = createAudioResource(nextSurah.link, {
                                        inputType: 'arbitrary',
                                        inlineVolume: true
                                    });
                                    player.play(nextResource);
                                    voiceInfo.streamUrl = nextSurah.link;
                                    voiceInfo.audioFile = nextSurah.link;
                                } catch (error) {
                                    logger.error('Error playing next surah', interaction.guildId, { error: error.message });
                                }
                            }, 2000);
                        }
                    });

                } else {
                    player.on(AudioPlayerStatus.Idle, () => {
                        const voiceInfo = client.voiceConnections.get(interaction.guildId);
                        if (voiceInfo && !voiceInfo.isMP3Quran) {
                            setTimeout(() => {
                                try {
                                    const newResource = createAudioResource(streamUrl, {
                                        inputType: 'arbitrary',
                                        inlineVolume: true
                                    });
                                    player.play(newResource);
                                } catch (error) {
                                    logger.error('Auto-retry failed', interaction.guildId, { error: error.message });
                                }
                            }, 3000);
                        }
                    });

                    const resource = createAudioResource(streamUrl, {
                        inputType: 'arbitrary',
                        inlineVolume: true
                    });

                    player.play(resource);

                    client.voiceConnections.set(interaction.guildId, {
                        connection: connection,
                        player: player,
                        channelId: interaction.member.voice.channel.id,
                        streamUrl: streamUrl,
                        audioFile: streamUrl,
                        type: 'قرآن',
                        radioName: radioName,
                        isMP3Quran: false,
                        rejoin: true
                    });
                }

                connection.subscribe(player);

                player.on('error', error => {
                    logger.error('Audio player error', interaction.guildId, { error: error.message });
                    const voiceInfo = client.voiceConnections.get(interaction.guildId);

                    if (voiceInfo && voiceInfo.isMP3Quran) {
                        setTimeout(() => {
                            try {
                                const currentSurah = voiceInfo.quranData.audio[voiceInfo.currentSurahIndex];
                                const retryResource = createAudioResource(currentSurah.link, {
                                    inputType: 'arbitrary',
                                    inlineVolume: true
                                });
                                player.play(retryResource);
                            } catch (retryError) {
                                logger.error('Retry failed for surah', interaction.guildId, { error: retryError.message });
                            }
                        }, 5000);
                    } else {
                        setTimeout(() => {
                            try {
                                const newResource = createAudioResource(streamUrl, {
                                    inputType: 'arbitrary',
                                    inlineVolume: true
                                });
                                player.play(newResource);
                            } catch (retryError) {
                                logger.error('Radio retry failed', interaction.guildId, { error: retryError.message });
                            }
                        }, 5000);
                    }
                });

                connection.on('error', error => {
                    logger.error('Voice connection error', interaction.guildId, { error: error.message });
                    if (typeof client.saveCurrentState === 'function') {
                        client.saveCurrentState();
                    }
                });

                connection.on('disconnected', () => {
                    if (typeof client.saveCurrentState === 'function') {
                        client.saveCurrentState();
                    }
                });

                try {
                    let statusMessage = `🎵 تم تشغيل ${radioName} بنجاح!\n`;
                    if (isMP3Quran) {
                        statusMessage += `📖 سيتم تشغيل القرآن الكريم بالترتيب من السورة 1 إلى 114\n🔄 سيعيد التشغيل تلقائياً عند الانتهاء\n⏹️ استخدم \`/توقف\` لإيقاف التشغيل`;
                    } else {
                        statusMessage += `📻 البث مستمر... استخدم \`/توقف\` لإيقاف البث`;
                    }

                    await i.update({
                        content: statusMessage,
                        components: []
                    });
                } catch (updateError) {
                }

            } catch (error) {
                logger.error('Error starting playback', interaction.guildId, { error: error.message });
                try {
                    await i.update({
                        content: ' حدث خطأ أثناء تشغيل الإذاعة',
                        components: []
                    });
                } catch (updateError) {
                }
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                try {
                    interaction.editReply({
                        content: ' انتهت مهلة الاختيار',
                        components: []
                    });
                } catch (error) {
                }
            }
        });
    }
};
