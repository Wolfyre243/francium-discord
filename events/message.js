import { Events } from 'discord.js';
import config from '../config.json' with { type: "json" };
import { generateAudioResource, audioPlayer, speakAudio } from '../library/TTS_tools.js';
import { generateResponse } from '../library/ollamaTools.js';

const endpoint = config.endpoint;

// 1242754476914249779
export const event = {
	name: Events.MessageCreate,
    once: false,
	async execute(message) {
        if (message.author.bot) return;
        
        // Gatekeep the bot for now to prevent unexpected errors
        if (message.author.username == "wolfyre.") {
            try {
                await message.channel.sendTyping();
                const response = await generateResponse(message.content);
                
                // Handle error status code
                // if (response.statusCode == 500) {
                //     console.log("Error in API request:", response.error);
                //     message.reply("Uh oh, my brain's not working! (Psst! Error code 500!)");
                //     return;
                // }

                message.reply(response.result);

                if (!(message.member.voice.channelId)) {
                    console.log("User is not in a voice channel.")
                    return;
                }
                
                // const audioResource = await generateAudioResource(responseJSON.result);
                // audioPlayer.play(audioResource);
                speakAudio(response.result);

            } catch (error) {
                await message.reply("There was an error with my brain...");
                console.log(error);
            }
            return;
        }
	},
};