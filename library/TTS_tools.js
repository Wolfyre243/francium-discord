// This file connects a new player to the voice channel that the bot is currently in.
// Only connect if the user who sent the message is in the specific vc.

const { joinVoiceChannel, createAudioPlayer, AudioPlayerStatus, VoiceConnectionStatus, createAudioResource } = require('@discordjs/voice');
const { endpoint, guildId } = require('../config.json');

const fs = require('fs');
const path = require('path');

const generateAudioResource = async (message) => {
    // Use the francium server to generate Buffer
    const output = await fetch(`http://${endpoint}:3030/texttospeech`, {
        method: "POST",
        body: JSON.stringify({
            message: "Hello, I am Alyssa!",
        }),
        headers: {
            "Content-Type": "application/json"
        }
    });

    // Parse response and create an mp3 file
    const outputJSON = await output.json();
    fs.writeFileSync(path.join(__dirname, '../audio/output.mp3'), Buffer.from(outputJSON.base64String, 'base64'));
    console.log("file written!");

    // Read the created mp3 file and generate an audio resource for the player to play.
    const audioResource = createAudioResource(path.join(__dirname, '../audio/output.mp3'));
    console.log("Audio created successfully");

    return audioResource;
}

module.exports = { generateAudioResource };