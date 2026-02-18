// G.H.O.S.T. - Ghost Hunter's Optimal Security Tool
require('dotenv').config();

const { Client, Collection, GatewayIntentBits, Partials, PartialGroupDMChannel } = require('discord.js');

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
mongoose.connect(process.env.MONGO_URI);

const Sentry = require('@sentry/node');
Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: 'production'
});

client.commands = new Collection();
client.events = new Collection();

['command_handler', 'event_handler', 'error_handler'].forEach((handler) => {
    require(`./handlers/${handler}`)(client);
});

client.login(process.env.TOKEN);