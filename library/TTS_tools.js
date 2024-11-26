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
  EndBehaviorType,
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState
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
const sudoId = config.sudoId;
const __dirname = import.meta.dirname;

// A debounce to prevent queuing of audio
let canPlay = true;

// -------------------------------------- Main Script ---------------------------------------------------------
// Initialise audio player
export const connectVoice = async (client, channelId, guildId) => {
    const audioPlayer = createAudioPlayer();
    // console.log("Audio player created!");

    audioPlayer.on(AudioPlayerStatus.Playing, () => {
        console.log(`Playing audio in guild with ID: ${guildId}`);
    });

    audioPlayer.on(AudioPlayerStatus.Idle, () => {
        canPlay = true;
    });

    audioPlayer.on('error', (e) => {
        console.log(`Error: ${e}`);
    });

    const voiceConnection = joinVoiceChannel({
        channelId: channelId, // Add a channel resolver here, to match the default vc of each server
        guildId: guildId,
        adapterCreator: client.guilds.resolve(guildId).voiceAdapterCreator,
        selfDeaf: false,
    });

    voiceConnection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
        try {
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
            ]);
            // Seems to be reconnecting to a new channel - ignore disconnect
        } catch (error) {
            // Seems to be a real disconnect which SHOULDN'T be recovered from
            connection.destroy();
        }
    });

    // When ready, subscribe to the audio player.
    voiceConnection.on(VoiceConnectionStatus.Ready, () => {
        console.log("Voice Connection Established!");
        // client.voiceManager.set(guildId, voiceConnection);

        const audioSubscription = voiceConnection.subscribe(audioPlayer);
        client.voiceConnects.set(guildId, audioSubscription);
    });

    await entersState(voiceConnection, VoiceConnectionStatus.Ready, 20e3);
    const receiver = voiceConnection.receiver;

    // Set event listeners
    receiver.speaking.on("start", async (userId) => {
        console.log(`User ${userId} started speaking!`);
        // Only allow authorised user to speak to the bot.
        if (userId !== sudoId) return;
        // // If audio is already playing or buffering, do not invoke anything.
        // if (audioPlayer.state == AudioPlayerStatus.Playing || audioPlayer.state == AudioPlayerStatus.Buffering) return;
        
        // If a subscription already exists, exit.
        // If audioPlayer is already playing or buffering, exit.
        if (receiver.subscriptions.size > 0) {
            return;
        };
        createListeningStream(receiver, userId, client, audioPlayer);
    });

    return { voiceConnection, audioPlayer };
}

export const generateAudioResource = async (message) => {
    // Use the francium server to generate Buffer
    const uid = v4();

    try {
        const output = await fetch(`http://${endpoint}:3030/api/texttospeech`, {
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
        fs.writeFileSync(path.join(__dirname, `../audio/output_${uid}.mp3`), Buffer.from(outputJSON.base64String, 'base64'));
        console.log("file written!");
    
        // Read the created mp3 file and generate an audio resource for the player to play.
        const audioResource = createAudioResource(path.join(__dirname, `../audio/output_${uid}.mp3`));
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

export const speakAudio = async (message, audioPlayer) => {
    const audioResource = await generateAudioResource(message);
    audioPlayer.play(audioResource);
}

export const createListeningStream = async (receiver, userId, client, audioPlayer) => {
    const logChannel = client.channels.resolve(config.logChannelId);

    if (!canPlay) {
        console.log("Audio player is busy.");
        await logChannel.send(`I'm already playing audio!`);
        return;
    }

    canPlay = false;
    // Create a listening stream upon subscription to specified user.
    const listenStream = receiver.subscribe(userId, {
        end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 2000, // Max 2s of silence before ending the stream.
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
            .output(path.join(__dirname, `../audio/${uid}.wav`))
            .on('end', async () => {
                console.log("file written!");
                fs.unlinkSync(path.join(__dirname, `../audio/${uid}.pcm`));
                // fs.unlinkSync(path.join(__dirname, `../audio/${userId}_${uid}.wav`));
                console.log("deleted pcm file");
            })
            .on("error", (err) => {
                console.error("Error:", err);
            })
            .run();

        console.log('created mp3 file');
        
        // After generation, transcribe the audio and return the transcribed message.
        const userMessage = await transcribeAudio(path.join(__dirname, `../audio/${uid}.wav`));
        console.log(`Transcribed Message: ${userMessage}`);

        const response = await generateResponse(`${client.users.resolve(userId).username}: ${userMessage}`);
        console.log(`Generated Response: ${response.result}`);
        speakAudio(response.result, audioPlayer);

        logChannel.send(response.result);
    });
}

// module.exports = { generateAudioResource, audioPlayer, createListeningStream, transcribeAudio };