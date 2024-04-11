// G.H.O.S.T. - Ghost Hunter's Optimal Security Tool
require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');

const { Discord, Client, Collection, GatewayIntentBits, Partials, PartialGroupDMChannel } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildVoiceStates],
    partials: [Partials.User, Partials.Channel, Partials.Message, PartialGroupDMChannel],
    allowedMentions: {
        parse: ['users'],
        repliedUser: false
    }
});

const mongoose = require('mongoose');

mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    client.commands.set(command.data.name, command);
}

client.events = new Collection();

['command_handler', 'event_handler', 'error_handler'].forEach((handler) => {
    require(`./handlers/${handler}`)(client, Discord);
});

client.on('interactionCreate', async (interaction) => {
    const command = client.commands.get(interaction.commandName);

    if ((interaction.isChatInputCommand()) && (command)) {
        try {
            await command.execute(interaction);
        } catch (err) {
            console.error(err);
    
            return interaction.reply({ content: 'An issue occurred trying to execute that command. Contact <@528759471514845194> if this continues happening.', ephemeral: true });
        }
    }
});

client.login(process.env.TOKEN);