import { Events } from 'discord.js';
import {
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState
} from '@discordjs/voice';
import { 
  audioPlayer, 
  createListeningStream 
} from '../library/TTS_tools.js';
import config from '../config.json' with { type: "json" };

const guildId = config.guildId;
const sudoId = config.sudoId;


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

		const voiceConnection = joinVoiceChannel({
			channelId: '1289466509864992873', // Alyssa's Den VC
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
		});

		// Set up voice recorder / detector
		// TODO: Find a better way to decode this someday...
		await entersState(voiceConnection, VoiceConnectionStatus.Ready, 20e3);
		const receiver = voiceConnection.receiver;

		// Set event listeners
		receiver.speaking.on("start", (userId) => {
			console.log(`User ${userId} started speaking!`);
			if (userId !== sudoId) return;
			createListeningStream(receiver, userId);
		});

	},
};