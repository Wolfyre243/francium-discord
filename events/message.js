const { Events } = require('discord.js');
const { formatPrevMessages } = require('../library/formatPrevMsgs');
const { endpoint, guildId, voiceChannelId } = require('../config.json');
const { joinVoiceChannel, createAudioPlayer, AudioPlayerStatus, VoiceConnectionStatus, createAudioResource } = require('@discordjs/voice');
const { generateAudioResource } = require('../library/TTS_tools');

// 1242754476914249779
module.exports = {
	name: Events.MessageCreate,
    once: false,
	async execute(message) {
        if (message.author.bot) return;
        
        // Gatekeep the bot for now to prevent unexpected errors
        if (message.author.username == "wolfyre.") {
            try {
                await message.channel.sendTyping();
                const response = await fetch(`http://${endpoint}:3030/francium`, {
                    method: 'POST',
                    body: JSON.stringify({
                        message: message.content
                    }),
                    headers: {
                        "Content-Type": "application/json"
                    }
                });
                // Handle error status code
                if (response.statusCode == 500) {
                    console.log("Error in API request:", response.error);
                    message.reply("Uh oh, my brain's not working! (Psst! Error code 500!)");
                    return;
                }
                
                const responseJSON = await response.json();
                message.reply(responseJSON.result);

                if (!(message.member.voice.channelId)) {
                    console.log("User is not in a voice channel.")
                    return;
                }

                // Create a new audio player
                const audioPlayer = createAudioPlayer();
                console.log("Audio player created!");

                audioPlayer.on(AudioPlayerStatus.Playing, () => {
                    console.log('Playing audio!');
                });
                
                // Unsubscribe a few seconds after the player becomes idle.
                // After that, destroy the connection.
                // audioPlayer.on('stateChange', (oldState, newState) => {
                //     console.log(`State changed from ${oldState} to ${newState}!`);
                //     // console.log('Finished playing audio!');
                //     // setTimeout(() => {
                //     //     subscription.unsubscribe();
                //     //     voiceConnection.destroy();
                //     //     player.stop();
                //     // }, 3000);
                // });
            
                audioPlayer.on('error', (e) => {
                    console.log(`Error: ${e}`);
                });

                // Establish a Voice Connection
                const voiceConnection = joinVoiceChannel({
                    channelId: message.member.voice.channelId, // Alyssa's Den VC
                    guildId: guildId,
                    adapterCreator: message.guild.voiceAdapterCreator
                });
            
                // Handle Disconnection
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
                    voiceConnection.subscribe(audioPlayer);
                });

                // Generate audio
                const audioResource = await generateAudioResource(responseJSON.result);
                audioPlayer.play(audioResource);

                

            } catch (error) {
                await message.reply("There was an error with my brain...");
                console.log(error);
            }
            return;
        }
	},
};