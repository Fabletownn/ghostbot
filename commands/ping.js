const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const sf = require('seconds-formater');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Provides the bot\'s ping, trip latency, and heartbeat')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    async execute(interaction) {
        // Send the initial message in order to get trip latency
        const pingReceived = await interaction.reply({ content: '<:bGhostPing:1042254166736777286>', fetchReply: true, ephemeral: false });

        const tripLatency = Math.round(pingReceived.createdTimestamp - interaction.createdTimestamp).toLocaleString(); // Trip latency between edits
        const botHeartbeat = interaction.client.ws.ping.toLocaleString();   // Bot heartbeat
        const uptimeInSeconds = (interaction.client.uptime / 1000) || 0;  // Bot uptime

        // Edit the message with ping statistics
        await interaction.editReply({ content: `Uptime: ${sf.convert(uptimeInSeconds).format('**Dd Hh Mm** and **Ss**')}\nTrip Latency: **${tripLatency}ms**\nHeartbeat: **${(botHeartbeat < 0) ? 'Unable to determine' : `${botHeartbeat}ms`}**` });
    },
};