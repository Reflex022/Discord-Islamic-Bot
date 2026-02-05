const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const logger = require('../utils/logger');
const https = require('https');
const { createCanvas, loadImage } = require('canvas');

const CLOUDINARY_BASE_URL = 'https://res.cloudinary.com/waleed022/image/upload';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('صفحة_قرآن')
        .setDescription('عرض صفحة من القرآن الكريم (1-604)')
        .addIntegerOption(option =>
            option.setName('رقم_الصفحة')
                .setDescription('رقم الصفحة (1-604)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(604)
        ),

    async execute(interaction, client) {
        let pageNumber = interaction.options.getInteger('رقم_الصفحة');
        await sendQuranPage(interaction, pageNumber);
    }
};

async function getQuranPageUrl(pageNumber) {
    const pageStr = pageNumber.toString().padStart(3, '0');
    return `${CLOUDINARY_BASE_URL}/quran_pages/${pageStr}.png`;
}

async function getQuranPageWithWhiteBackground(pageNumber) {
    const imageUrl = await getQuranPageUrl(pageNumber);
    
    try {
        const image = await loadImage(imageUrl);
        
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.drawImage(image, 0, 0);
        
        return canvas.toBuffer('image/png');
    } catch (error) {
        logger.error('Error processing Quran page', null, { pageNumber, error: error.message });
        return null;
    }
}

async function sendQuranPage(interaction, pageNumber) {
    try {
        const imageBuffer = await getQuranPageWithWhiteBackground(pageNumber);

        if (!imageBuffer) {
            const content = `❌ الصفحة ${pageNumber} غير موجودة`;
            if (interaction.deferred || interaction.replied) {
                return interaction.editReply({ content, components: [] });
            }
            return interaction.reply({ content, flags: 64 });
        }

        const attachment = new AttachmentBuilder(imageBuffer, { name: `quran_page_${pageNumber}.png` });

        const embed = new EmbedBuilder()
            .setColor(0xFFFFFF)  
            .setTitle(`📖 صفحة ${pageNumber} من القرآن الكريم`)
            .setImage(`attachment://quran_page_${pageNumber}.png`)
            .setFooter({ text: `صفحة ${pageNumber} من 604` })
            .setTimestamp();

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`quran_prev_${pageNumber}`)
                    .setLabel('الصفحة السابقة')
                    .setEmoji('⬅️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(pageNumber <= 1),
                new ButtonBuilder()
                    .setCustomId(`quran_next_${pageNumber}`)
                    .setLabel('الصفحة التالية')
                    .setEmoji('➡️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(pageNumber >= 604)
            );

        const messageOptions = {
            embeds: [embed],
            files: [attachment],
            components: [buttons],
            flags: 64 
        };

        let reply;
        if (interaction.deferred || interaction.replied) {
            reply = await interaction.editReply(messageOptions);
        } else {
            const response = await interaction.reply({ ...messageOptions, withResponse: true });
            reply = response.resource.message;
        }

        const collector = reply.createMessageComponentCollector({
            time: 600000
        });

        collector.on('collect', async btnI => {
            if (btnI.user.id !== interaction.user.id) {
                return btnI.reply({
                    content: 'لا يمكنك استخدام هذه الأزرار',
                    flags: 64
                });
            }

            await btnI.deferUpdate();

            const currentPage = parseInt(btnI.customId.split('_')[2]);
            const newPage = btnI.customId.startsWith('quran_prev') ? currentPage - 1 : currentPage + 1;

            if (newPage < 1 || newPage > 604) return;

            const newImageBuffer = await getQuranPageWithWhiteBackground(newPage);
            if (!newImageBuffer) return;

            const newAttachment = new AttachmentBuilder(newImageBuffer, { name: `quran_page_${newPage}.png` });

            const newEmbed = new EmbedBuilder()
                .setColor(0xFFFFFF)  
                .setTitle(`📖 صفحة ${newPage} من القرآن الكريم`)
                .setImage(`attachment://quran_page_${newPage}.png`)
                .setFooter({ text: `صفحة ${newPage} من 604` })
                .setTimestamp();

            const newButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`quran_prev_${newPage}`)
                        .setLabel('الصفحة السابقة')
                        .setEmoji('⬅️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(newPage <= 1),
                    new ButtonBuilder()
                        .setCustomId(`quran_next_${newPage}`)
                        .setLabel('الصفحة التالية')
                        .setEmoji('➡️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(newPage >= 604)
                );

            await btnI.editReply({
                embeds: [newEmbed],
                files: [newAttachment],
                components: [newButtons]
            });
        });

        collector.on('end', async () => {
            try {
                await reply.edit({ components: [] });
            } catch (e) { }
        });

    } catch (error) {
        logger.error('Error sending Quran page', interaction.guildId, { error: error.message });
        const content = '❌ حدث خطأ أثناء عرض الصفحة. حاول مرة أخرى.';
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content });
        } else {
            await interaction.reply({ content, flags: 64 });
        }
    }
}
