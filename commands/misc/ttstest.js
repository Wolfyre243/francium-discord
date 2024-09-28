// Import everything
const { SlashCommandBuilder } = require('discord.js');
const { endpoint } = require('../../config.json');

const { getVoiceConnections, createAudioPlayer, AudioPlayerStatus, createAudioResource, generateDependencyReport, VoiceConnectionStatus } = require('@discordjs/voice');

const fs = require('fs');
const path = require('path');

console.log(generateDependencyReport());

module.exports = {
    category: 'misc',
    data: new SlashCommandBuilder()
            .setName('ttstest') // This should be the same as the file name
            .setDescription('A command to test TTS'),

    async execute(interaction) {
        // Fetch audio from server
        const output = await fetch(`http://${endpoint}:3030/texttospeech`, {
            method: "POST",
            body: JSON.stringify({
                message: "Hello! I am Alyssa, and this is a test output file.",
            }),
            headers: {
                "Content-Type": "application/json"
            }
        });
        // Parse audio base64 string into a wav file
        const outputJSON = await output.json();
        fs.writeFileSync(path.join(__dirname, '../../audio/output.mp3'), Buffer.from(outputJSON.base64String, 'base64'));
        console.log("file written!");

        const { voice } = interaction.member;
        console.log(voice.channelId); // shld be 1281188442180554798
        if (!voice.channelId) {
            await interaction.reply(`You must be in a voice channel to use this command.`);
            return;
        }

        console.log(getVoiceConnections());
        // // Set up an audio player
        // const player = createAudioPlayer();
        // player.on(AudioPlayerStatus.Playing, () => {
        //     console.log("Playing audio!");
        // });

        // player.on('error', (e) => {
        //     console.log(`Error: ${e}`);
        // })

        // // Join the specified voice channel
        // const voiceConnection = joinVoiceChannel({
        //     channelId: voice.channelId,
        //     guildId: interaction.guildId,
        //     adapterCreator: interaction.guild.voiceAdapterCreator
        // })

        // voiceConnection.on(VoiceConnectionStatus.Ready, () => {
        //     console.log(`Voice connection established!`);
        //     interaction.reply("Successfully connected to voice channel!");

        //     const audioResource = createAudioResource(path.join(__dirname, '../../audio/output.mp3')); // <- error here
        //     player.play(audioResource);
        //     console.log("Audio created successfully");

        //     const voiceSubscription = voiceConnection.subscribe(player);
        //     console.log("Subscribed successfully");
        // })

        
        
        return;

        // const status = voiceConnection.playOpusPacket(Buffer.from(outputJSON.base64String, 'base64'));
        // console.log(status);
        // const audio = voiceConnection.prepareAudioPacket(Buffer.from(outputJSON.base64String, 'base64'));
        // voiceConnection.dispatchAudio();

        
    }
}