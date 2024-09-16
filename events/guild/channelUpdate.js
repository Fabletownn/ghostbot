const { AuditLogEvent, ChannelType, EmbedBuilder, PermissionsBitField } = require('discord.js');
const LCONFIG = require('../../models/logconfig.js');
const wf = require('../../handlers/webhook_functions.js');

module.exports = async (Discord, client, oldChannel, newChannel) => {
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

        const channelType = (newChannel.type === ChannelType.GuildText) ? 'Text' :
            (newChannel.type === ChannelType.GuildForum) ? 'Forum' :
                (newChannel.type === ChannelType.GuildVoice) ? 'Voice' :
                    (newChannel.type === ChannelType.GuildAnnouncement) ? 'Announcement' :
                        (newChannel.type === ChannelType.GuildCategory) ? 'Category' : 'Server';

        const cTimestamp = Math.round((Date.now()) / 1000);

        ///////////////////////////// Name
        if (oldName !== newName) {
            await delaySearch(7000);
            
            await newChannel.guild.fetchAuditLogs({ limit: 10, type: AuditLogEvent.ChannelUpdate }).then(async (audit) => {
                const auditLogs = audit.entries.filter((entry) => entry.targetId === newChannel.id && Date.now() - entry.createdTimestamp < 15000);
                const relevantLog = auditLogs.first();
                
                if (!relevantLog) return;
                
                const { executor } = relevantLog;
                const executorTag = (!executor) ? 'Unknown' : executor.tag;
                const executorAvatar = (!executor) ? 'https://i.imgur.com/cguNuyW.png' : executor.displayAvatarURL({ size: 512, dynamic: true });
                const executorID = (!executor) ? 'Unknown' : executor.id;

                const nameEmbed = new EmbedBuilder()
                    .setAuthor({ name: executorTag, iconURL: executorAvatar })
                    .setDescription(`${channelType} channel name has been updated: <#${newChannel.id}> (${newChannel.name})`)
                    .addFields([
                        { name: 'New', value: newChannel.name || 'Unknown', inline: true },
                        { name: 'Previous', value: oldChannel.name || 'Unknown', inline: true },
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
            await delaySearch(7000);
            
            await newChannel.guild.fetchAuditLogs({ limit: 10, type: AuditLogEvent.ChannelOverwriteUpdate }).then(async (audit) => {
                const auditLogs = audit.entries.filter((entry) => entry.targetId === newChannel.id && Date.now() - entry.createdTimestamp < 15000);
                const relevantLog = auditLogs.first();

                if (!relevantLog) return;

                const { executor, changes, extra } = relevantLog;
                const executorTag = executor ? executor.tag : 'Unknown';
                const executorAvatar = executor ? executor.displayAvatarURL({ size: 512, dynamic: true }) : 'https://i.imgur.com/cguNuyW.png';
                const executorID = executor ? executor.id : 'Unknown';
                if (executor && executor.bot) return;

                const oldPermsString = oldChannel.permissionOverwrites.cache.map(perm => perm.allow.toArray().concat(perm.deny.toArray()).join('')).join('');
                const newPermsString = newChannel.permissionOverwrites.cache.map(perm => perm.allow.toArray().concat(perm.deny.toArray()).join('')).join('');
                
                if (oldPermsString === newPermsString) return;

                let updateID = extra.id;
                let updateType = newChannel.guild.roles.cache.has(updateID) ? 'Role' : (newChannel.guild.members.cache.has(updateID) ? 'User' : 'Unknown');
                let updateMention = updateID === newChannel.guild.id ? 'Everyone' : newChannel.guild.roles.cache.has(updateID) ? `<@&${updateID}>` : `<@${updateID}>`;

                let allowChanges = new Set();
                let denyChanges = new Set();

                for (let change of changes) {
                    if (change.key === 'allow' || change.key === 'deny') {
                        const oldPerms = new PermissionsBitField(change.old);
                        const newPerms = new PermissionsBitField(change.new);

                        const addedPerms = newPerms.toArray().filter(perm => !oldPerms.has(perm));
                        const removedPerms = oldPerms.toArray().filter(perm => !newPerms.has(perm));

                        if (change.key === 'allow') {
                            addedPerms.forEach(perm => allowChanges.add(perm));
                            removedPerms.forEach(perm => denyChanges.add(perm));
                        } else if (change.key === 'deny') {
                            addedPerms.forEach(perm => denyChanges.add(perm));
                            removedPerms.forEach(perm => allowChanges.add(perm));
                        }
                    }
                }

                const allowNames = allowChanges.size > 0 ? Array.from(allowChanges).join('\n').replace(/(?<=[a-z])([A-Z])/g, ' $1').trim() : 'None';
                const denyNames = denyChanges.size > 0 ? Array.from(denyChanges).join('\n').replace(/(?<=[a-z])([A-Z])/g, ' $1').trim() : 'None';

                const permEmbed = new EmbedBuilder()
                    .setAuthor({ name: `${executorTag} updated a channel`, iconURL: executorAvatar })
                    .setDescription(`${channelType} channel permissions have been updated: <#${newChannel.id}> (${newChannel.name})`)
                    .addFields([
                        { name: 'Updated', value: `${updateType || 'Unknown'} ${updateMention || 'Unknown'}`, inline: true },
                        { name: 'Allowed', value: allowNames !== 'None' ? allowNames : 'None', inline: true },
                        { name: 'Denied', value: denyNames !== 'None' ? denyNames : 'None', inline: true },
                        { name: '\u200b', value: '\u200b', inline: true },
                        { name: 'Date', value: `<t:${Math.floor(Date.now() / 1000)}:F>` },
                        { name: 'ID', value: `\`\`\`ini\nExecutor = ${executorID}\nChannel = ${newChannel.id}\`\`\`` }
                    ])
                    .setTimestamp();

                await wf.useWebhookIfExisting(client, data.chanupchannel, data.chanupwebhook, permEmbed);
            });
        }
    });
}

function delaySearch(delayMS) {
    // Delays the search of audit logs because they can be late, so it's
    // better to just wait, fetch the last 10 (or however many),
    // and filter out the one needed, rather than immediately get the
    // last log available which could be wrong/unrelated
    return new Promise(resolve => setTimeout(resolve, delayMS));
}