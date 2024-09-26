const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    category: 'utility', // This should match the category name
    data: new SlashCommandBuilder()
            .setName('ping') // /ping
            .setDescription('Replies with Pong!'),

    async execute(interaction) {
        await interaction.reply('Pong!');
    }
}