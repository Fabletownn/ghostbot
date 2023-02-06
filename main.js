require('dotenv').config();

const { Discord, Client, Collection, GatewayIntentBits, Partials, PartialGroupDMChannel } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.DirectMessageReactions, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildVoiceStates],
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
client.events = new Collection();

['command_handler', 'event_handler', 'error_handler'].forEach((handler) => {
    require(`./handlers/${handler}`)(client, Discord);
});

client.login(process.env.TOKEN);