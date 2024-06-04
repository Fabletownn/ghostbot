const { AuditLogEvent, ChannelType, EmbedBuilder, PermissionsBitField } = require('discord.js');
const LCONFIG = require('../../models/logconfig.js');
const wf = require('../../handlers/webhook_functions.js');

module.exports = async (Discord, client, oldChannel, newChannel) => {
    // TO FIX SOON
    
    /*
    LCONFIG.findOne({
        guildID: newChannel.guild.id
    }, async (err, data) => {
        if (err) return console.log(err);
        if (!data) return;
        if (!data.chanupchannel) return;
        if (!data.chanupwebhook) return;

        const oldName = oldChannel.name;
        const newName = newChannel.name;

        const oldPermissions = oldChannel.permissionOverwrites.cache;
        const newPermissions = newChannel.permissionOverwrites.cache;

        const channelType = (newChannel.type === ChannelType.GuildText) ? 'Text' : (newChannel.type === ChannelType.GuildForum) ? 'Forum' : (newChannel.type === ChannelType.GuildVoice) ? 'Voice' : (newChannel.type === ChannelType.GuildAnnouncement) ? 'Announcement' : (newChannel.type === ChannelType.GuildCategory) ? 'Category' : 'Server';

        const cTimestamp = Math.round((Date.now()) / 1000);

        ///////////////////////////// Name
        if (oldName !== newName) {
            await newChannel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelUpdate }).then(async (audit) => {
                const { executor } = audit.entries.first();

                const executorTag = (!executor || executor === null) ? 'Unknown' : executor.tag;
                const executorAvatar = (!executor || executor === null) ? 'https://i.imgur.com/cguNuyW.png' : executor.displayAvatarURL({ size: 512, dynamic: true });
                const executorID = (!executor || executor === null) ? 'Unknown' : executor.id;

                const nameEmbed = new EmbedBuilder()
                    .setAuthor({ name: executorTag, iconURL: executorAvatar })
                    .setDescription(`${channelType} channel name has been updated: <#${newChannel.id}> (${newChannel.name})`)
                    .addFields([
                        { name: 'New', value: newChannel.name, inline: true },
                        { name: 'Previous', value: oldChannel.name, inline: true },
                        { name: '\u200b', value: '\u200b', inline: true },
                        { name: 'Date', value: `<t:${cTimestamp}:F>` },
                        { name: 'ID', value: `\`\`\`ini\nExecutor = ${executorID}\nChannel = ${newChannel.id}\`\`\`` }
                    ])
                    .setTimestamp()

                await wf.useWebhookIfExisting(client, data.chanupchannel, data.chanupwebhook, nameEmbed);
            });
        }

        ///////////////////////////// Permissions
        if (oldPermissions !== newPermissions) {
            await newChannel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelOverwriteUpdate }).then(async (audit) => {
                const { executor } = audit.entries.first();

                const executorTag = (!executor || executor === null) ? 'Unknown' : executor.tag;
                const executorAvatar = (!executor || executor === null) ? 'https://i.imgur.com/cguNuyW.png' : executor.displayAvatarURL({ size: 512, dynamic: true });
                const executorID = (!executor || executor === null) ? 'Unknown' : executor.id;

                if (executor.bot) return;

                let permissionChanges = {};
                let updateID = audit.entries.first().extra.id;
                let updateType = (newChannel.guild.roles.cache.get(updateID) ? 'Role' : (newChannel.guild.members.cache.get(updateID) ? 'User' : 'Unknown'));
                let updateMention = (updateID === newChannel.guild.id ? 'Everyone' : newChannel.guild.roles.cache.get(updateID) ? `<@&${updateID}>` : (newChannel.guild.members.cache.get(updateID) ? `<@${updateID}>` : updateID));
                let allow;
                let deny;

                for (let change of audit.entries.first().changes || []) {
                    permissionChanges[change.key] = [change.old, change.new];
                }

                allow = (permissionChanges.allow) ? new PermissionsBitField(`${permissionChanges.allow[1]}`).toArray() : 'None';
                deny = (permissionChanges.deny) ? new PermissionsBitField(`${permissionChanges.deny[1]}`).toArray() : 'None';

                const permEmbed = new EmbedBuilder()
                    .setAuthor({ name: `${executorTag} updated a channel`, iconURL: executorAvatar })
                    .setDescription(`${channelType} channel permissions have been updated: <#${newChannel.id}> (${newChannel.name})`)
                    .addFields([
                        { name: 'Updated', value: `${updateType} ${updateMention}`, inline: true },
                        { name: 'Allowed', value: (allow !== 'None' && allow !== null) ? allow.join('\n').replace(/(?<=[a-z])([A-Z])/g, ' $1').trim() : 'None', inline: true },
                        { name: 'Denied', value: (deny !== 'None' && allow !== null) ? deny.join('\n').replace(/(?<=[a-z])([A-Z])/g, ' $1').trim() : 'None', inline: true },
                        { name: '\u200b', value: '\u200b', inline: true },
                        { name: 'Date', value: `<t:${cTimestamp}:F>` },
                        { name: 'ID', value: `\`\`\`ini\nExecutor = ${executorID}\nChannel = ${newChannel.id}\`\`\`` }
                    ])
                    .setTimestamp()

                await wf.useWebhookIfExisting(client, data.chanupchannel, data.chanupwebhook, permEmbed);
            });
        }
    });
    */
}