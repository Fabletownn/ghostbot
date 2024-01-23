const sf = require('seconds-formater');

module.exports = {
    name: 'ping',
    description: 'Provides bot uptime, latency, API response time',
    category: 'staff',
    syntax: 'ping',
    async execute(client, message) {
        await message.reply('<:bGhostPing:1042254166736777286>').then((updatePing) => {
            const tripLatency = Math.round(updatePing.createdTimestamp - message.createdTimestamp).toLocaleString();
            const botHeartbeat = client.ws.ping.toLocaleString();

            const uptimeInSeconds = (client.uptime / 1000) || 0;

            updatePing.edit(`Roundtrip Latency (Edit): ${tripLatency}ms\nHeartbeat: ${botHeartbeat}ms\nUptime: ${sf.convert(uptimeInSeconds).format('Dd Hh Mm Ss')}`);
        });
    }
};