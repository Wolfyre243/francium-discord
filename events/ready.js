const { Events } = require('discord.js');

// 1242754476914249779
module.exports = {
	name: Events.ClientReady,
	once: true,
    // When the client is ready, run this code (only once).
    // The name of this function shouldn't matter
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};