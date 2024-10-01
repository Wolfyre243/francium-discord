import { SlashCommandBuilder } from 'discord.js';

export const command = {
    category: 'utility', // This should match the category name
    data: new SlashCommandBuilder()
            .setName('ping') // /ping
            .setDescription('Replies with Pong!'),

    async execute(interaction) {
        await interaction.reply('Pong!');
    }
}