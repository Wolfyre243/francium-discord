const { SlashCommandBuilder } = require('discord.js');
const { category } = require('./ping');

module.exports = {
	category: 'utility',
	data: new SlashCommandBuilder()
		.setName('reload')
		.setDescription('Reloads a command.')
		.addStringOption(option =>
			option.setName('command')
				.setDescription('The command to reload.')
				.setRequired(true)),
	async execute(interaction) {
        // Retrieve command args
		const commandName = interaction.options.getString('command', true).toLowerCase();

        // Check if the specified command exists
		const command = interaction.client.commands.get(commandName);
		if (!command) {
            // If command doesn't exist, end the interaction.
			return interaction.reply(`There is no command with name \`${commandName}\`!`);
		}
        // If command exists:
        // Remove the command from cache
        delete require.cache[require.resolve(`../${command.category}/${command.data.name}.js`)];
        // Attempt to reload the cache with the command back in
		try {
            // Obtain the command again
	        const newCommand = require(`../${command.category}/${command.data.name}.js`);
	        interaction.client.commands.set(newCommand.data.name, newCommand);
            // If successful, reply with success message.
	        await interaction.reply(`Command \`${newCommand.data.name}\` was reloaded!`);
		} catch (error) {
	        console.error(error);
	        await interaction.reply(`There was an error while reloading a command \`${command.data.name}\`:\n\`${error.message}\``);
		}
	},
};