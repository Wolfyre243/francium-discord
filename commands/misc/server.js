import { SlashCommandBuilder } from 'discord.js';

export const command = {
    category: 'misc',
    data: new SlashCommandBuilder()
            .setName('server') // /ping
            .setDescription('Replies with server information'),

    async execute(interaction) {
        await interaction.reply(`This server is ${interaction.guild.name} and has ${interaction.guild.memberCount} members.`);
    }
}