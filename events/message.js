const { Events } = require('discord.js');
const { formatPrevMessages } = require('../lib/formatPrevMsgs')

// 1242754476914249779
module.exports = {
	name: Events.MessageCreate,
    // When the client is ready, run this code (only once).
    // The name of this function shouldn't matter
	async execute(message) {
        if (message.author.bot) return; // Automatically stop if the detected message was a bot's
        // Gatekeep the bot for now to prevent unexpected errors
        // let prevMessages = await message.channel.messages.fetch({ limit: 15 });
        // prevMessages.reverse();
        
        // await fetch('http://localhost:3030/francium/discord-init', {
        //     method: 'PUT',
        //     body: JSON.stringify({
        //         message: "hello",
        //         context: formatPrevMessages(prevMessages)
        //     }),
        //     headers: {
        //         "Content-Type": "application/json"
        //     }
        // });

        if (message.author.username == "wolfyre.") {
            try {
                await message.channel.sendTyping();
                const response = await fetch('http://host.docker.internal:3030/francium', {
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
                
            } catch (error) {
                console.log(error);
            }
            return;
        }
	},
};