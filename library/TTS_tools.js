// This file connects a new player to the voice channel that the bot is currently in.
// Only connect if the user who sent the message is in the specific vc.

// Import a TON of dependencies
// const { createAudioResource, createAudioPlayer, AudioPlayerStatus, EndBehaviorType } = require('@discordjs/voice');
// Import encoder/decoder
// const prism = require('prism-media');
// // Import ffmpeg tooling
// const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
// const ffmpeg = require('fluent-ffmpeg');
// ffmpeg.setFfmpegPath(ffmpegPath);

// // Import langchain pipelines
// const { pipeline } = require('@xenova/transformers');

// // Miscellaneous
// const fs = require('fs');
// const path = require('path');
// const { v4 } = require('uuid');
// const { endpoint } = require('../config.json');

import {
  createAudioResource,
  createAudioPlayer,
  AudioPlayerStatus,
  EndBehaviorType
} from '@discordjs/voice';

// Import encoder/decoder
import prism from 'prism-media';

// Import ffmpeg tooling
// import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
ffmpeg.setFfmpegPath(ffmpegPath);

// Import wavefile utility
import wavefile from 'wavefile';

// Import langchain pipelines
import { pipeline } from '@xenova/transformers';

// Miscellaneous
import fs from 'fs';
import path from 'path';
import { v4 } from 'uuid';
import config from '../config.json' with { type: "json" };
import { generateResponse } from './ollamaTools.js';

const endpoint = config.endpoint;
const __dirname = import.meta.dirname;
console.log(__dirname)

// -------------------------------------- Main Script ---------------------------------------------------------
// Initialise audio player
export const audioPlayer = createAudioPlayer();
console.log("Audio player created!");

audioPlayer.on(AudioPlayerStatus.Playing, () => {
    console.log('Playing audio!');
});

audioPlayer.on('error', (e) => {
    console.log(`Error: ${e}`);
});

export const generateAudioResource = async (message) => {
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

export const transcribeAudio = async (filepath) => {
    const transcriber = await pipeline('automatic-speech-recognition', 'distil-whisper/distil-large-v3');
    const recording = new wavefile.WaveFile(fs.readFileSync(filepath));
    recording.toBitDepth('32f');
    recording.toSampleRate(16000);
    let audioData = recording.getSamples();

    if (Array.isArray(audioData)) audioData = audioData[0];

    const output = await transcriber(audioData);

    return output.text;
}

export const speakAudio = async (message) => {
    const audioResource = await generateAudioResource(message);
    audioPlayer.play(audioResource);
}

export const createListeningStream = async (receiver, userId) => {
    // Create a listening stream upon subscription to specified user.
    const listenStream = receiver.subscribe(userId, {
        end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 100,
        }
    });

    // Generate a uid for the audio file.
    const uid = v4();
    // Create a stream that writes a new pcm file with the generated uid
    const writeStream = fs.createWriteStream(path.join(__dirname, `../audio/${uid}.pcm`), { flags: 'a' });

    // Create the pipeline
    listenStream
        .pipe(new prism.opus.Decoder({
            rate: 48000,
            channels: 2,
            frameSize: 960
        }))
        .pipe(writeStream);

    // When user stops talking, stop the stream and generate an mp3 file.
    listenStream.on('end', async () => {
        console.log("attempting to write mp3 file...");
        // const pcmObj = fs.readFileSync(path.join(__dirname, `../audio/${uid}.pcm`));
        // console.log(pcmObj)
        ffmpeg()
            .input(path.join(__dirname, `../audio/${uid}.pcm`))
            .inputFormat('s32le')
            .audioFrequency(60000)
            .audioChannels(2)
            .output(path.join(__dirname, '../audio/recording.wav'))
            .on('end', async () => {
                console.log("file written!");
                fs.unlinkSync(path.join(__dirname, `../audio/${uid}.pcm`));
                console.log("deleted pcm file");
            })
            .on("error", (err) => {
                console.error("Error:", err);
            })
            .run();

        console.log('created mp3 file');
        // After generation, transcribe the audio and return the transcribed message.
        const userMessage = await transcribeAudio(path.join(__dirname, `../audio/recording.wav`));
        console.log(`Transcribed Message: ${userMessage}`);

        const response = await generateResponse(userMessage);
        console.log(`Generated Response: ${response.result}`);
        speakAudio(response.result);

    });
}

// module.exports = { generateAudioResource, audioPlayer, createListeningStream, transcribeAudio };