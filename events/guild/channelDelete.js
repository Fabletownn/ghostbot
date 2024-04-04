const { AuditLogEvent, ChannelType, EmbedBuilder } = require('discord.js');
const LCONFIG = require('../../models/logconfig.js');
const wf = require('../../handlers/webhook_functions.js');

module.exports = async (Discord, client, channel) => {
    LCONFIG.findOne({
        guildID: channel.guild.id
    }, async (err, data) => {
        if (err) return console.log(err);
        if (!data) return;
        if (!data.chanupchannel) return;
        if (!data.chanupwebhook) return;

        const cTimestamp = Math.round((Date.now()) / 1000);

        const channelType = (channel.type === ChannelType.GuildText) ? 'Text' : (channel.type === ChannelType.GuildForum) ? 'Forum' : (channel.type === ChannelType.GuildVoice) ? 'Voice' : (channel.type === ChannelType.GuildAnnouncement) ? 'Announcement' : (channel.type === ChannelType.GuildCategory) ? 'Category' : 'Server';

        ///////////////////////////// Delete
        await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete }).then(async (audit) => {
            const { executor } = audit.entries.first();

            const executorTag = (!executor || executor === null) ? 'Unknown' : executor.tag;
            const executorAvatar = (!executor || executor === null) ? 'https://i.imgur.com/cguNuyW.png' : executor.displayAvatarURL({ size: 512, dynamic: true });
            const executorID = (!executor || executor === null) ? 'Unknown' : executor.id;

            const deleteEmbed = new EmbedBuilder()
                .setAuthor({ name: `${executorTag} deleted a channel`, iconURL: executorAvatar })
                .setDescription(`${channelType} channel has been deleted: ${channel.name}`)
                .addFields([
                    { name: 'Name', value: channel.name },
                    { name: 'Date', value: `<t:${cTimestamp}:F>` },
                    { name: 'ID', value: `\`\`\`ini\nExecutor = ${executorID}\`\`\`` }
                ])
                .setTimestamp()

            await wf.useWebhookIfExisting(client, data.chanupchannel, data.chanupwebhook, deleteEmbed);
        });
    });
}