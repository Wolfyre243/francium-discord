import { Events } from 'discord.js';
import config from '../config.json' with { type: "json" };
import { generateAudioResource, audioPlayer } from '../library/TTS_tools.js';

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