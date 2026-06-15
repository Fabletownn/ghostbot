// G.H.O.S.T. - Ghost Hunter's Optimal Security Tool
require('dotenv').config();

const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,           // needed for slash commands and server information
        GatewayIntentBits.MessageContent,   // needed for reporting, logging deletes/edits,
        GatewayIntentBits.GuildMessages,    // needed for reporting, logging deletes/edits, etc.
        GatewayIntentBits.GuildMembers,     // needed for pullrooms, logging username changes, etc.
        GatewayIntentBits.GuildVoiceStates  // needed for custom voice channels
    ],
    partials: [
        Partials.User,      // useful for member search
        Partials.Channel,   // useful for message caching
        Partials.Message    // useful for logging
    ],
    allowedMentions: {
        parse: ['users'],   // never be able to mention roles or @/everyone unless the reply function
        repliedUser: false  // directly specifies - useful for cases of accidental pings
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