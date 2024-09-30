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
const { channel } = require('diagnostics_channel');
const { BaseGuild } = require('discord.js');
const { error } = require('console');

const audioPlayer = createAudioPlayer();
console.log("Audio player created!");

audioPlayer.on(AudioPlayerStatus.Playing, () => {
    console.log('Playing audio!');
});

audioPlayer.on('error', (e) => {
    console.log(`Error: ${e}`);
});

// Unsubscribe a few seconds after the player becomes idle.
// After that, destroy the connection.
// audioPlayer.on('stateChange', (oldState, newState) => {
//     console.log(`State changed from ${oldState.status} to ${newState.status}!`);
//     if (oldState.status == "playing" && newState.status == "idle") {
//         console.log('Finished playing audio!');
//         setTimeout(() => {
//             subscription.unsubscribe();
//             voiceConnection.destroy();
//             audioPlayer.stop();
//         }, 3000);
//     }
    
// });


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
    // const writeStream = fs.createWriteStream(path.join(__dirname, '../audio/recording.pcm'));
    const listenStream = receiver.subscribe(userId, {
        end: {
            behaviour: EndBehaviorType.AfterSilence,
            duration: 100,
        }
    });

    const encoder = new OpusScript(48000, 2, OpusScript.Application.AUDIO);


    const writeStream = fs.createWriteStream(path.join(__dirname, '../audio/recording.pcm'), { flags: 'a' });

    listenStream.on('data', (chunk) => {
        console.log("received data");
    });

    // pipeline(listenStream, opusDecoder, writeStream, (err) => {
    //     if (err) {
    //         console.log("Error writing file: ", err.message);
    //     } else {
    //         console.log("wrote pcm file");
    //     }
    // })

    listenStream
        .pipe(new prism.opus.Decoder({
            rate: 48000,
            channels: 2,
            frameSize: 960,
        }))
        .pipe(writeStream);

    // subscription.on('end', () => {
    //     console.log("attempting to write file...");
    //     fs.writeFileSync(path.join(__dirname, '../audio/recording.mp3'), Buffer.from(buffer));
    // });

    receiver.speaking.on('end', () => {
        console.log("attempting to write mp3 file...");
        // const realbuffer = fs.readFileSync(path.join(__dirname, '../audio/recording.pcm')).toString('base64');
        // fs.writeFileSync(path.join(__dirname, '../audio/recording.mp3'), Buffer.from(realbuffer, 'base64'));
        setTimeout(() => {
            ffmpeg()
                .input(path.join(__dirname, '../audio/recording.pcm'))
                .inputFormat('s16le')
                .audioBitrate(128)
                .audioFrequency(48000)
                .audioChannels(2)
                .output(path.join(__dirname, '../audio/recording.mp3'))
                .on('end', async () => {
                    console.log("file written!");
                })
                .on("error", (err) => {
                    console.error("Error:", err);
                })
                .run();
        }, 3000);

        // const isthisabuffer = fs.readFileSync(path.join(__dirname, '../audio/recording.pcm'));
        // console.log(isthisabuffer);

        // fs.writeFileSync(path.join(__dirname, '../audio/recording.mp3'), isthisabuffer)
        console.log("wrote file");
    });
}

module.exports = { generateAudioResource, audioPlayer, createListeningStream };