const { ChannelType } = require('discord.js');
const CONFIG = require('../../models/config.js');
const PULL = require('../../models/pullrooms.js');
const SUB = require('../../models/subscriptions.js');

module.exports = async (Discord, client, message) => {
    if (message.author.bot) return;
    if (message.guild === null || message.channel === null || message.channel.parent === null) return;

    const cData = await CONFIG.findOne({
        guildID: message.guild.id
    });

    if (!cData) return;

    /*
        Automatically publishes messages posted in announcement channels
        "/config-edit value:Autopublishing (Boolean) boolean:False" disables this
    */
    if (message.channel.type === ChannelType.GuildAnnouncement) {
        if ((message.crosspostable) && (cData.autopublish === true)) {
            await message.crosspost();
        }
    }

    /*
        Used for logging messages sent in pullroom sessions
        "/config-edit value:Pullroom Logs channel:X" changes where this gets sent
    */
    if (message.channel.parent.id === cData.pullcategoryid) {
        const pData = await PULL.findOne({ guildID: message.guild.id, channelID: message.channel.id }); // Get existing pullroom data
        
        // If there is no pullroom with the channel ID existing, don't log anything
        if (!pData) return;

        // Otherwise, save the message sent and send it into the pullroom transcript
        pData.transcript += `[${new Date().toLocaleString().replace(',', '')}] ${message.author.username} (${message.author.id}): ${message.content || '<No Content - File/Sticker>'}\n`;
        pData.save().catch((err) => trailError(err));
    }

    /*
        Used for messaging staff members if they subscribed to a post in one of the following forums
        tech-support, vr-tech-support, bug-reports, map-reports, vr-bug-reports
    */
    const triggeredChannels = ['1034230224973484112', '1034231311147216959'];

    if (triggeredChannels.some((chID) => message.channel.parent.id === chID)) {
        const sData = await SUB.findOne({ guildID: message.guild.id,  postID: message.channel.id }); // Get existing subscription data

        if (!sData) return;

        // If there is a user subscribed to a thread, track whether or not the OP has posted yet to notify those subscribed
        if ((sData.subbed.length > 0)) {
            if (sData.op === message.author.id) {
                if (!sData.posted) {
                    for (let i = 0; i < sData.subbed.length; i++) {
                        client.users.cache.get(sData.subbed[i]).send({ content: `📌 Your ${message.channel.parent.name} post "**${client.channels.cache.get(sData.postID).name || 'Unknown'}**" has received a response(s) from the poster.\n\nJump: ${message.url}` }).catch(() => { });
                    }

                    sData.posted = true;
                    await sData.save().catch((err) => trailError(err));
                }
            }

            // Set the OP to not have replied yet if a user subscribed to the thread responds
            if (sData.subbed.includes(message.author.id)) {
                if (sData.posted) {
                    sData.posted = false;
                    await sData.save().catch((err) => trailError(err));
                }
            }
        }
    }

    /*
        Automatically applies the 'Being Helped' forum tag and removes 'Need Help' if a staff member
        replies to a thread in one of the following channels
        tech-support, vr-tech-support
    */
    const techChannels = ['1082421799578521620', '1020011442205900870'];
    const techRoles = ['1145866363479523358', '759255791605383208', '756591038373691606', '749029859048816651', '759265333600190545'];

    if (cData.tagapply === true) {
        // Ensure it is in a tech-support channel and the person responding has a staff role
        if (techChannels.some((chID) => message.channel.parent.id === chID)) {
            if (techRoles.some((role) => message.member.roles.cache.has(role))) {
                const parentChannel = message.channel.parent; // Category of the current channel
                const currentAppliedTags = message.channel.appliedTags; // Map of all applied tags

                // Find and use the "Being Helped" & "Needs Help" tag
                const beingHelpedTag = parentChannel.availableTags.find((tag) => tag.name.toLowerCase() === 'being helped');
                const needsHelpTag = parentChannel.availableTags.find((tag) => tag.name.toLowerCase() === 'needs help');

                // So long as both exist, find and add a "Being Helped" tag & remove "Needs Help" if already there
                if (beingHelpedTag && needsHelpTag) {
                    if (!(message.channel.appliedTags.some((tag) => tag.includes(beingHelpedTag.id)))) {
                        const tagsToApply = [];

                        for (let i = 0; i < currentAppliedTags.length; i++) {
                            if (currentAppliedTags[i] !== needsHelpTag.id) tagsToApply.push(currentAppliedTags[i]);
                        }

                        tagsToApply.push(beingHelpedTag.id);

                        await message.channel.setAppliedTags(tagsToApply, 'Edited \'Being Helped\' and \'Needs Help\' tags automatically as a staff member replied.');
                    }
                }
            }
        }
    }

    /*
        Automatically creates a thread under messages in suggestion channels
        suggestion-voting, staff-candidate-voting
    */
    const suggestionChannels = ['771924501645754408', '762935209377005569'];

    let threadTitle = message.author.username;

    if (cData.threadcreate === true) {
        if (suggestionChannels.some((chID) => message.channel.id === chID)) {
            switch (message.channel.id) {
                case '771924501645754408':
                    threadTitle += ' - Suggestion Discussion';

                    createThread(message, threadTitle);
                    break;

                case '762935209377005569':
                    threadTitle += ' - Staff Candidate Discussion';

                    createThread(message, threadTitle);
                    break;

                default:
                    threadTitle += ' - Discussion';

                    createThread(message, threadTitle);
                    break;
            }
        }
    }
}

async function createThread(message, title) {
    await message.channel.threads.create({
        startMessage: message.id,
        name: title,
        autoArchiveDuration: 10080,
        reason: 'Created thread automatically as member posted in a suggestion channel (#' + message.channel.name + ')'
    });
}