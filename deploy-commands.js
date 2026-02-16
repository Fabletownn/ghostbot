require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const contextsPath = path.join(__dirname, 'contexts');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
const contextFiles = fs.readdirSync(contextsPath).filter((file) => file.endsWith('.js'));

///// Process slash commands in commands directory
for (const file of commandFiles) {
    const cmdPath = path.join(commandsPath, file);
    const slash_command = require(cmdPath);

    commands.push(slash_command.data.toJSON());
    console.log('Processed slash command: ' + slash_command.data.name);
}

///// Process context commands in contexts directory
for (const file of contextFiles) {
    const ctxtPath = path.join(contextsPath, file);
    const context_command = require(ctxtPath);

    commands.push(context_command.data.toJSON());
    console.log('Processed context command: ' + context_command.data.name);
}

const rest = new REST({
    version: '10'
}).setToken(process.env.TOKEN);

rest.put(Routes.applicationGuildCommands(process.env.CLIENTID, process.env.GUILDID), {
    body: commands
}).then(() => console.log('Successfully registered application commands to the main server.')).catch(console.error);