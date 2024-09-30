// This file connects a new player to the voice channel that the bot is currently in.
// Only connect if the user who sent the message is in the specific vc.

const { createAudioResource, createAudioPlayer, AudioPlayerStatus, EndBehaviorType } = require('@discordjs/voice');
const prism = require('prism-media');
const OpusScript = require('opusscript');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
const { endpoint } = require('../config.json');

const fs = require('fs');
const path = require('path');
const { v4 } = require('uuid');

const audioPlayer = createAudioPlayer();
console.log("Audio player created!");

audioPlayer.on(AudioPlayerStatus.Playing, () => {
    console.log('Playing audio!');
});

audioPlayer.on('error', (e) => {
    console.log(`Error: ${e}`);
});

const generateAudioResource = async (message) => {
    // Use the francium server to generate Buffer
    try {
        const output = await fetch(`http://${endpoint}:3030/texttospeech`, {
            method: "POST",
            body: JSON.stringify({
                message: message,
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
    } catch (error) {
        console.log(`Error: ${error}`);
    }   
}

const createListeningStream = async (receiver, userId) => {
    const listenStream = receiver.subscribe(userId, {
        end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 100,
        }
    });

    const uid = v4();
    const writeStream = fs.createWriteStream(path.join(__dirname, `../audio/${uid}.pcm`), { flags: 'a' });

    // listenStream.on('data', (chunk) => {
    //     console.log("received data");
    // });

    listenStream
        .pipe(new prism.opus.Decoder({
            rate: 48000,
            channels: 2,
            frameSize: 960
        }))
        .pipe(writeStream);

    listenStream.on('end', () => {
        console.log("attempting to write mp3 file...");
        // const realbuffer = fs.readFileSync(path.join(__dirname, '../audio/recording.pcm')).toString('base64');
        // fs.writeFileSync(path.join(__dirname, '../audio/recording.mp3'), Buffer.from(realbuffer, 'base64'));
        setTimeout(() => {
            ffmpeg()
                .input(path.join(__dirname, `../audio/${uid}.pcm`))
                .inputFormat('s32le')
                .audioBitrate(128)
                .audioFrequency(48000)
                .audioChannels(2)
                .output(path.join(__dirname, '../audio/recording.mp3'))
                .on('end', async () => {
                    console.log("file written!");
                    fs.unlinkSync(path.join(__dirname, `../audio/${uid}.pcm`));
                    console.log("deleted pcm file");
                })
                .on("error", (err) => {
                    console.error("Error:", err);
                })
                .run();
        }, 3000);

        console.log("wrote file");
    });
}

module.exports = { generateAudioResource, audioPlayer, createListeningStream };