const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnections } = require('@discordjs/voice');
const { guildId } = require('../../config.json');

module.exports = {
    category: 'voice', // This should match the category name
    data: new SlashCommandBuilder()
            .setName('record')
            .setDescription('A test command to test recording a VC.'),

    async execute(interaction) {
        console.log(getVoiceConnections().get(guildId)[0])
        await interaction.reply('Pong!');
    }
}