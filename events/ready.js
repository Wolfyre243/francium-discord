const { Events } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const { audioPlayer } = require('../library/TTS_tools');
const { guildId } = require('../config.json');

module.exports = {
	name: Events.ClientReady,
	once: true,
    // When the client is ready, run this code (only once).
    // The name of this function shouldn't matter
	async execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}.`);

		// When the bot is ready, join its dedicated voice channel.
		// This might change in the future.
		// We will be creating a SINGLE voice connection

		// Note that by doing this, the voice connection is to never be severed. I will look into better ways
		// to persist the connection (and allow for disconnects) next time.

		const voiceConnection = joinVoiceChannel({
			channelId: '1289466509864992873', // Alyssa's Den VC
			guildId: guildId,
			adapterCreator: client.guilds.resolve(guildId).voiceAdapterCreator
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
			subscription = voiceConnection.subscribe(audioPlayer);
		});

	},
};