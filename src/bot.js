require('dotenv').config();

const { Client, IntentsBitField, ActivityType, } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const chatgptCommand = require('./functions/chatgptCommand.js');
const { scheduleMessage, scheduleFridayMessage } = require('./functions/scheduler.js');
const { handleMessageCreate } = require('./functions/messageHandler.js');
const { Player } = require("discord-music-player");

const token = process.env.DISCORDJS_BOT_TOKEN;
const app = process.env.APP_ID
const pogoy = process.env.GUILD_ID
const yleinenChannel = process.env.YLEINEN_ID
const bingAPI = process.env.BING_API


const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.GuildMessageReactions,
    ],
});

client.once('ready', () => {
    console.log(`${client.user.tag} on hereillä.`);
    scheduleMessage(client, yleinenChannel, bingAPI);
    scheduleFridayMessage(client, yleinenChannel);
    client.user.setActivity({
        name: 'Neekaboom 💥',
        type: ActivityType.Watching,
    });
});

const player = new Player(client, {
    leaveOnEmpty: false, // This options are optional.
});

client.player = player;

client.on('messageCreate', (message) => {
    handleMessageCreate(client, message, bingAPI);
});

const commands = [
    chatgptCommand.data.toJSON(),
];

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');
  
        await rest.put(
            Routes.applicationGuildCommands(app,pogoy),
            { body: commands },
        );
  
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;
  
    const { commandName } = interaction;
  
    if (commandName === 'anu') {
      await chatgptCommand.execute(interaction);
    }
    // tänne lisää
});

client.login(token);