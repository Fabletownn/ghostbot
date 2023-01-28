const Discord = require('discord.js');
const fs = require('fs');

module.exports = (client, Discord) => {
    const load_dir = (dirs) => {

        process.on('unhandledRejection', (reason, promise) => {

            console.log(reason, promise);

            return client.channels.cache.get('1029169352378941502').send(`<t:${Math.round(parseInt(Date.now()) / 1000)}:F> An error came through (unhandled rejection).\n\`\`\`${reason}\n${promise}\`\`\``);

        });

        process.on('uncaughtException', (reason, promise) => {

            console.log(reason, promise);

            return client.channels.cache.get('1029169352378941502').send(`<t:${Math.round(parseInt(Date.now()) / 1000)}:F> An error came through (uncaught exception).\n\`\`\`${reason}\n${promise}\`\`\``);

        });

        process.on('uncaughtExceptionMonitor', (reason, promise) => {

            console.log(reason, promise);

            return client.channels.cache.get('1029169352378941502').send(`<t:${Math.round(parseInt(Date.now()) / 1000)}:F> An error came through (monitor).\n\`\`\`${reason}\n${promise}\`\`\``);

        });

        process.on('rejectionHandled', (reason, promise) => {

            console.log(reason, promise);

            return client.channels.cache.get('1029169352378941502').send(`<t:${Math.round(parseInt(Date.now()) / 1000)}:F> An error came through (promise rejection).\n\`\`\`${reason}\n${promise}\`\`\``);

        });

    }

    ['guild'].forEach(e => load_dir(e));
    
}