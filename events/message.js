import { Events } from 'discord.js';
import config from '../config.json' with { type: "json" };
import { speakAudio } from '../library/TTS_tools.js';
import { generateResponse } from '../library/ollamaTools.js';

const endpoint = config.endpoint;

// 1242754476914249779
export const event = {
	name: Events.MessageCreate,
    once: false,
	async execute(message) {
        if (message.author.bot) return;
        if (message.author.username !== 'wolfyre.') return;
        
        try {
            await message.channel.sendTyping(); //message.author.username
            const response = await generateResponse(message.content, message.member.displayName);
            message.reply(response.result);

            if (!message.member.voice.channelId) {
                console.log("User is not in a voice channel.");
                return;
            }
            
            // const audioResource = await generateAudioResource(responseJSON.result);
            // audioPlayer.play(audioResource);
            const voiceSub = message.client.voiceConnects.get(message.guildId);
            speakAudio(response.result, voiceSub.player);

        } catch (error) {
            await message.reply("There was an error with my brain...");
            console.log(error);
        }
        return;
        
	},
};