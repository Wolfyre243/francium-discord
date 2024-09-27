// Import everything
const { SlashCommandBuilder } = require('discord.js');
const { endpoint } = require('../../config.json');
const wavefile = require('wavefile');
const fs = require('fs');


module.exports = {
    category: 'misc',
    data: new SlashCommandBuilder()
            .setName('test-tts')
            .setDescription('A command to test TTS'),

    async execute(interaction) {
        const output = await fetch(`http://${endpoint}:3030/texttospeech`, {
            method: "POST",
            body: JSON.stringify({
                message: "Hello! I am Alyssa, and this is a test output file.",
            }),
            headers: {
                "Content-Type": "application/json"
            }
        })

        const outputJSON = await output.json();
        // console.log(outputJSON.base64String);
        
        // const wav = new wavefile.WaveFile();
        // wav.fromScratch(1, outputJSON.sampling_rate, '32f', outputJSON.audio);
        fs.writeFileSync('output.wav', Buffer.from(outputJSON.base64String, 'base64'));

        // fs.writeFileSync()

        console.log("file written!");

        await interaction.reply(`TTS Speech generated. Check your console.`);
    }
}