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
		// const logChannel = client.channels.resolve(config.logChannelId);
		// When the bot is ready, join its dedicated voice channel.
		// This might change in the future.
		// We will be creating a SINGLE voice connection

		// const voiceConnection = joinVoiceChannel({
		// 	channelId: voiceChannelId, // Alyssa's Den VC
		// 	guildId: guildId,
		// 	adapterCreator: client.guilds.resolve(guildId).voiceAdapterCreator,
		// 	selfDeaf: false,
		// });

		// voiceConnection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
		// 	try {
		// 		await Promise.race([
		// 			entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
		// 			entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
		// 		]);
		// 		// Seems to be reconnecting to a new channel - ignore disconnect
		// 	} catch (error) {
		// 		// Seems to be a real disconnect which SHOULDN'T be recovered from
		// 		connection.destroy();
		// 	}
		// });

		// // When ready, subscribe to the audio player.
		// voiceConnection.on(VoiceConnectionStatus.Ready, () => {
		// 	console.log("Voice Connection Established!");
		// 	// client.voiceManager.set(guildId, voiceConnection);

		// 	const audioSubscription = voiceConnection.subscribe(audioPlayer);
		// });

		// Initiate the voice channels in each guild this bot is in.
		const Guilds = client.guilds.cache.map(guild => {
			// VCs that support Alyssa have to be named General.
			try {
				const generalVC = guild.channels.cache.find(channel => channel.name === "General");
				connectVoice(client, generalVC.id, guild.id);
				console.log(`Connected Voice to ${guild.name} (${guild.id})`);
			} catch (error) {
				console.log(`Could not find General VC in ${guild.name} (${guild.id})`);
			}
		})

		// Set up voice recorder / detector
		// await entersState(voiceConnection, VoiceConnectionStatus.Ready, 20e3);
		// const receiver = voiceConnection.receiver;

		// // Set event listeners
		// receiver.speaking.on("start", async (userId) => {
		// 	console.log(`User ${userId} started speaking!`);
		// 	// Only allow authorised user to speak to the bot.
		// 	if (userId !== sudoId) return;
		// 	// // If audio is already playing or buffering, do not invoke anything.
		// 	// if (audioPlayer.state == AudioPlayerStatus.Playing || audioPlayer.state == AudioPlayerStatus.Buffering) return;
			
		// 	// If a subscription already exists, exit.
		// 	// If audioPlayer is already playing or buffering, exit.
		// 	if (receiver.subscriptions.size > 0) {
		// 		return;
		// 	};
		// 	createListeningStream(receiver, userId, client);
		// });

	},
};