const { AuditLogEvent, ChannelType, EmbedBuilder } = require('discord.js');
const { useWebhookIfExisting } = require('../../utils/webhook-utils.js');

module.exports = async (Discord, client, channel) => {
    const lData = client.cachedLogConfig; // Get existing log configuration data

    // Do not log anything if there is no data, log channel, or log webhook
    if (!lData) return;
    if (!lData.chanupchannel) return;
    if (!lData.chanupwebhook) return;

    const channelType = (channel.type === ChannelType.GuildText) ? 'Text' :
                                (channel.type === ChannelType.GuildForum) ? 'Forum' :
                                (channel.type === ChannelType.GuildVoice) ? 'Voice' :
                                (channel.type === ChannelType.GuildAnnouncement) ? 'Announcement' :
                                (channel.type === ChannelType.GuildCategory) ? 'Category' : 'Server';
    const cTimestamp = Math.round((Date.now()) / 1000);

    ///////////////////////////// Delete
    await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelCreate }).then(async (audit) => {
        const { executor } = audit.entries.first();

        const executorTag = (!executor) ? 'Unknown' : executor.tag;
        const executorAvatar = (!executor) ? 'https://i.imgur.com/cguNuyW.png' : executor.displayAvatarURL({ size: 512, dynamic: true });
        const executorID = (!executor) ? 'Unknown' : executor.id;

        if (executorID === '1043623513669513266') return; // Don't log ModMail channel creations

        const createEmbed = new EmbedBuilder()
            .setAuthor({ name: executorTag, iconURL: executorAvatar })
            .setDescription(`${channelType} channel has been created: <#${channel.id}> (${channel.name})`)
            .addFields([
                { name: 'Name', value: channel.name || 'Unknown' },
                { name: 'Date', value: `<t:${cTimestamp}:F>` },
                { name: 'ID', value: `\`\`\`ini\nExecutor = ${executorID}\nChannel = ${channel.id}\`\`\`` }
            ])
            .setTimestamp()

        if (channel.type !== ChannelType.GuildCategory)
            createEmbed.setFooter({ text: `Channel created in the category "${channel?.parent?.name || 'None'}"` });

        await useWebhookIfExisting(client, lData.chanupchannel, lData.chanupwebhook, createEmbed);
    });
}