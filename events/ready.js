import { Events } from 'discord.js';
import {
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState,
  AudioPlayerStatus
} from '@discordjs/voice';
import { 
  connectVoice, 
  createListeningStream 
} from '../library/TTS_tools.js';

export const event = {
	name: Events.ClientReady,
	once: true,
    // When the client is ready, run this code (only once).
    // The name of this function shouldn't matter
	async execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}.`);
		// When the bot is ready, join its dedicated voice channel.
		// This might change in the future.
		// We will be creating a SINGLE voice connection

		// Initiate the voice channels in each guild this bot is in.
		const Guilds = client.guilds.cache.map(guild => {
			// VCs that support Alyssa have to be named General.
			try {
				const generalVC = guild.channels.cache.find(channel => channel.name === "General" || channel.name === "roblox");
				connectVoice(client, generalVC.id, guild.id);
				console.log(`Connected Voice to ${guild.name} (${guild.id})`);
			} catch (error) {
				console.log(`Could not find General VC in ${guild.name} (${guild.id})`);
			}
		})
	},
};