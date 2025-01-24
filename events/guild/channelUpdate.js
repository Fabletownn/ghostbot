const { AuditLogEvent, ChannelType, EmbedBuilder, PermissionsBitField } = require('discord.js');
const LCONFIG = require('../../models/logconfig.js');
const wf = require('../../handlers/webhook_functions.js');

module.exports = async (Discord, client, oldChannel, newChannel) => {
    const data = await LCONFIG.findOne({ guildID: newChannel.guild.id }); // Get existing log configuration data

    // If there is no data, log channel, or log webhook, don't continue
    if (!data) return;
    if (!data.chanupchannel) return;
    if (!data.chanupwebhook) return;

    const oldName = oldChannel.name; // Old channel name
    const newName = newChannel.name; // New channel name

    const oldPermissions = oldChannel.permissionOverwrites.cache; // Map of old permissions
    const newPermissions = newChannel.permissionOverwrites.cache; // Map of new permissions, for comparison

    const channelType = (newChannel.type === ChannelType.GuildText) ? 'Text' :
                                (newChannel.type === ChannelType.GuildForum) ? 'Forum' :
                                (newChannel.type === ChannelType.GuildVoice) ? 'Voice' :
                                (newChannel.type === ChannelType.GuildAnnouncement) ? 'Announcement' :
                                (newChannel.type === ChannelType.GuildCategory) ? 'Category' : 'Server';

    const cTimestamp = Math.round((Date.now()) / 1000); // Timestamp of the current day and time

    ///////////////////////////// Name
    if (oldName !== newName) {
        // Delay the search to allow time for audit logs to update
        await delaySearch(7000);

        // Fetch the past 10 audit logs for any channel updates
        await newChannel.guild.fetchAuditLogs({ limit: 10, type: AuditLogEvent.ChannelUpdate }).then(async (audit) => {
            const auditLogs = audit.entries.filter((entry) => entry.targetId === newChannel.id && Date.now() - entry.createdTimestamp < 15000); // Filter for relevant and recent logs
            const relevantLog = auditLogs.first(); // Get the most recent log

            if (!relevantLog) return; // If there is no log found, don't continue as nothing can be done with it

            const { executor } = relevantLog; // Member who did the action
            const executorTag = (!executor) ? 'Unknown' : executor.tag; // Tag of the member who did the action
            const executorAvatar = (!executor) ? 'https://i.imgur.com/cguNuyW.png' : executor.displayAvatarURL({ size: 512, dynamic: true }); // Avatar of who did the action, otherwise default
            const executorID = (!executor) ? 'Unknown' : executor.id; // User ID of who did the action

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
        // Delay to allow audit logs to update
        await delaySearch(7000);

        // Fetch the past 10 audit logs for channel overwrite updates
        await newChannel.guild.fetchAuditLogs({ limit: 10, type: AuditLogEvent.ChannelOverwriteUpdate }).then(async (audit) => {
            const auditLogs = audit.entries.filter((entry) => entry.targetId === newChannel.id && Date.now() - entry.createdTimestamp < 15000); // Filter for relevant and recent logs
            const relevantLog = auditLogs.first(); // Fetch the most recent log

            if (!relevantLog) return; // Can't do anything with an empty or nonexistent log

            const { executor, changes, extra } = relevantLog; // Executor, permission changes, and other information stored in the audit log
            const executorTag = executor ? executor.tag : 'Unknown'; // Tag of the executor who changed the permission
            const executorAvatar = executor ? executor.displayAvatarURL({ size: 512, dynamic: true }) : 'https://i.imgur.com/cguNuyW.png'; // Avatar of the user who changed permissions
            const executorID = executor ? executor.id : 'Unknown'; // User ID of the user who changed permissions
            
            if (executor && executor.bot) return; // Don't log if the executor was a bot, don't want overlapping or spammed logs for ModMail

            // Map new and old permissions into a string for easier comparison, and don't log if they are the same
            const oldPermsString = oldChannel.permissionOverwrites.cache.map((perm) => perm.allow.toArray().concat(perm.deny.toArray()).join('')).join('');
            const newPermsString = newChannel.permissionOverwrites.cache.map((perm) => perm.allow.toArray().concat(perm.deny.toArray()).join('')).join('');

            if (oldPermsString === newPermsString) return;

            let updateID = extra.id; // ID of the user, role, or object that was changed to be mapped into a string:
            let updateType = newChannel.guild.roles.cache.has(updateID) ? 'Role' : (newChannel.guild.members.cache.has(updateID) ? 'User' : 'Unknown');
            let updateMention = updateID === newChannel.guild.id ? 'Everyone' : newChannel.guild.roles.cache.has(updateID) ? `<@&${updateID}>` : `<@${updateID}>`;

            // Create new sets of changes to add them into the log
            let allowChanges = new Set();
            let denyChanges = new Set();

            // For every change made that is logged, add that into the set of changes
            for (let change of changes) {
                if (change.key === 'allow' || change.key === 'deny') {
                    // Permissions bit field for old and new permission changes (to be converted to permission)
                    const oldPerms = new PermissionsBitField(change.old);
                    const newPerms = new PermissionsBitField(change.new);

                    // Create and filter permissions into their designated arrays
                    const addedPerms = newPerms.toArray().filter(perm => !oldPerms.has(perm));
                    const removedPerms = oldPerms.toArray().filter(perm => !newPerms.has(perm));

                    // For each change that was allowed, add it into the designated array
                    if (change.key === 'allow') {
                        addedPerms.forEach((perm) => allowChanges.add(perm));
                        removedPerms.forEach((perm) => denyChanges.add(perm));
                    } else if (change.key === 'deny') {
                        addedPerms.forEach((perm) => denyChanges.add(perm));
                        removedPerms.forEach((perm) => allowChanges.add(perm));
                    }
                }
            }

            // Convert all permission bit fields into their English Discord names
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
}

function delaySearch(delayMS) {
    // Delays the search of audit logs because they can be late, so it's
    // better to just wait, fetch the last 10 (or however many),
    // and filter out the one needed, rather than immediately get the
    // last log available which could be wrong/unrelated
    return new Promise(resolve => setTimeout(resolve, delayMS));
}