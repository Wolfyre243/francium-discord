//------------------------------Declare Variables------------------------------------
import fs from 'node:fs'; // Node's native file system module.
import path from 'node:path'; // Node's native path utility module.
import { Client, Collection, GatewayIntentBits, IntentsBitField } from 'discord.js';
import config from './config.json' with { type: "json" };

const token = config.token;

const __dirname = import.meta.dirname;

// Create a new Discord client
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        IntentsBitField.Flags.GuildVoiceStates
    ],
});

//---------------------------------Main Script----------------------------------------
// Adds a new property called "commands" to the client instance
// This allows us to access our commands in other files.
client.commands = new Collection(); // The collection class is an extension of the Map class, which we will be using to store commands

// 1. Initiate & Read Commands
const foldersPath = path.join(__dirname, 'commands'); // Constructs a path to the commands directory. "__dirname" is an environment variable for the root dir.
const commandFolders = fs.readdirSync(foldersPath); // Reads the path to the directory and returns an array of the folders in the "commands" directory.

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js')); // Reads the path to the directory and returns an array of files.

    for (const file of commandFiles) {
        const filePath = `./commands/${folder}/${file}`;
        const { command } = await import(filePath); // Require the command file and store it in the command variable

        // Set a new item in the Collection
        if ('data' in command && 'execute' in command) { // Check if the command was written properly
            client.commands.set(command.data.name, command) // The key is the command name and the value is the imported module.
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
};

// 2. Initiate and Fire the Event files
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = `./events/${file}`;
    const { event } = await import(filePath); // Require the event file and store it in the event variable

    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
        // e.g. client.on(Events.InteractionCreate, async interaction => {...}); where interaction is ...args
    }
};


// Log in to Discord with your client's token
client.login(token);