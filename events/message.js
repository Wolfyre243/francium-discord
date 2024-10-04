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
        
        try {
            await message.channel.sendTyping();
            const response = await generateResponse(`${message.author.username}: ${message.content}`);
            message.reply(response.result);

            if (!message.member.voice.channelId) {
                console.log("User is not in a voice channel.");
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
        
	},
};