const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const path = require('path');
const fs = require('fs');

let hadithData = { hadiths: [] };
try {
    const filePath = path.join(__dirname, '..', 'data', 'hadith_muslim.json');
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        hadithData = JSON.parse(content);
    }
} catch (error) {
    console.error('Failed to load hadith data:', error);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('حديث')
        .setDescription('يعرض حديث عشوائي من صحيح مسلم'),

    async execute(interaction) {
        if (!hadithData || !hadithData.hadiths || hadithData.hadiths.length === 0) {
            return interaction.reply({ content: '❌ خطا في تحميل بيانات الأحاديث.', flags: MessageFlags.Ephemeral });
        }

        const randomIndex = Math.floor(Math.random() * hadithData.hadiths.length);
        const randomHadith = hadithData.hadiths[randomIndex];

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`📜 حديث رقم ${randomHadith.hadith_number}`)
            .setDescription(randomHadith.text)
            .setFooter({ text: 'صحيح مسلم' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
