const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    category: 'misc',
    data: new SlashCommandBuilder()
            .setName('server') // /ping
            .setDescription('Replies with server information'),

    async execute(interaction) {
        await interaction.reply(`This server is ${interaction.guild.name} and has ${interaction.guild.memberCount} members.`);
    }
}