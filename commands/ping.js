const sf = require('seconds-formater');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Provides the bot\'s ping, trip latency, and heartbeat')
        .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),
    async execute(interaction) {
        const pingReceived = await interaction.reply({ content: '<:bGhostPing:1042254166736777286>', fetchReply: true, ephemeral: false });

        const tripLatency = Math.round(pingReceived.createdTimestamp - interaction.createdTimestamp).toLocaleString();
        const botHeartbeat = interaction.client.ws.ping.toLocaleString();

        const uptimeInSeconds = (interaction.client.uptime / 1000) || 0;

        await interaction.editReply({ content: `Uptime: ${sf.convert(uptimeInSeconds).format('**Dd Hh Mm** and **Ss**')}\nTrip Latency: **${tripLatency}ms**\nHeartbeat: **${(botHeartbeat < 0) ? 'Unable to determine' : `${botHeartbeat}ms`}**` });
    },
};