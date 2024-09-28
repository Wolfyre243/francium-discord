const { Events } = require('discord.js');


module.exports = {
	name: Events.ClientReady,
	once: true,
    // When the client is ready, run this code (only once).
    // The name of this function shouldn't matter
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}.`);

		// When the bot is ready, join its dedicated voice channel.
		// This might change in the future.
		// We will be creating a SINGLE voice connection

		// Note that by doing this, the voice connection is to never be severed. I will look into better ways
		// to persist the connection (and allow for disconnects) next time.

	},
};