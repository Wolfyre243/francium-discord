//------------------------------Declare Variables------------------------------------
import { REST, Routes} from 'discord.js';
import config from './config.json' with { type: "json" }; //Import the properties from the config file.
import fs from 'node:fs';
import path from 'node:path';

const clientId = config.clientId;
const guildId = config.guildId;
const token = config.token;

const __dirname = import.meta.dirname;

//Constructing the REST module
const rest = new REST().setToken(token);
//---------------------------------Main Script----------------------------------------
// Grab all of the command folders in the commands directory
const commands = [];
const foldersPath = path.join(__dirname, 'commands'); // BARCMK1R/commands
const commandFolders = fs.readdirSync(foldersPath); // Returns an array of the folders in the commands directory

for (const folder of commandFolders) {
    // Grab all of the command files in the command folders
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js')); // Filter out the .js files.

    for (const file of commandFiles) {
        const filePath = `./commands/${folder}/${file}`;
        const { command } = await import(filePath);
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON()); // Grab the data property from each command to use the 
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// Deploy commands
const deploy = async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // put() fully refreshes all commands in the server(guild) with the current set
        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        // If needed, body: [] will refresh the client/guild commands accordingly
        // Do this only if you have to clear any dupes

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);

    } catch (err) {
        console.error(err);
    }
}

deploy();