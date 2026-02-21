const { AuditLogEvent, ChannelType, EmbedBuilder } = require('discord.js');
const { useWebhookIfExisting } = require('../../utils/webhook-utils.js');

module.exports = async (Discord, client, channel) => {
    const lData = client.cachedLogConfig; // Get existing log configuration data

    // If there is no data, log channel, or log webhook, don't continue
    if (!lData) return;
    if (!lData.chanupchannel) return;
    if (!lData.chanupwebhook) return;

    const cTimestamp = Math.round((Date.now()) / 1000);

    const channelType = (channel.type === ChannelType.GuildText) ? 'Text' :
                                (channel.type === ChannelType.GuildForum) ? 'Forum' :
                                (channel.type === ChannelType.GuildVoice) ? 'Voice' :
                                (channel.type === ChannelType.GuildAnnouncement) ? 'Announcement' :
                                (channel.type === ChannelType.GuildCategory) ? 'Category' : 'Server';

    ///////////////////////////// Delete
    await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete }).then(async (audit) => {
        const { executor } = audit.entries.first();

        const executorTag = (!executor) ? 'Unknown' : executor.tag;
        const executorAvatar = (!executor) ? 'https://i.imgur.com/cguNuyW.png' : executor.displayAvatarURL({ size: 512, dynamic: true });
        const executorID = (!executor) ? 'Unknown' : executor.id;

        if (executorID === '1043623513669513266') return; // Don't log ModMail deletes

        const deleteEmbed = new EmbedBuilder()
            .setAuthor({ name: executorTag, iconURL: executorAvatar })
            .setDescription(`${channelType} channel has been deleted: ${channel.name}`)
            .addFields([
                { name: 'Name', value: channel.name || 'Unknown' },
                { name: 'Date', value: `<t:${cTimestamp}:F>` },
                { name: 'ID', value: `\`\`\`ini\nExecutor = ${executorID}\`\`\`` }
            ])
            .setTimestamp()

        await useWebhookIfExisting(client, lData.chanupchannel, lData.chanupwebhook, deleteEmbed);
    });
}