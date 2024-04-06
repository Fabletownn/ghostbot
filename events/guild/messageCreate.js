const { ChannelType } = require('discord.js');
const CONFIG = require('../../models/config.js');
const PULL = require('../../models/pullrooms.js');
const SUB = require('../../models/subscriptions.js');

module.exports = async (Discord, client, message) => {
    if (message.author.bot) return;
    if (message.guild === null) return;

    CONFIG.findOne({
        guildID: '435431947963990026'
    }, async (cErr, cData) => {
        if (cErr) return console.log(cErr);
        if (!cData) return;

        /*
            Automatically publishes messages posted in announcement channels
            "/config-edit value:Autopublishing (Boolean) boolean:False" disables this
        */
        if (message.channel.type === ChannelType.GuildAnnouncement) {
            if ((message.crosspostable) && (cData.autopublish == true)) {
                await message.crosspost();
            }
        }

        /*
            Used for logging messages sent in pullroom sessions
            "/config-edit value:Pullroom Logs channel:X" changes where this gets sent
        */
        if (message.channel.parent.id === cData.pullcategoryid) {
            PULL.findOne({
                guildID: message.guild.id,
                channelID: message.channel.id
            }, (pErr, pData) => {
                if (pErr) return;
                if (!pData) return;

                pData.transcript += `[${new Date().toLocaleString().replace(',', '')}] ${message.author.username} (${message.author.id}): ${message.content || '<No Content - File/Sticker>'}\n`;
                pData.save().catch((err) => console.log(err));
            });
        }

        /*
            Used for messaging staff members if they subscribed to a post in one of the following forums
            tech-support, vr-tech-support, bug-reports, map-reports, vr-bug-reports
        */
        const triggeredChannels = ['1034230224973484112', '1034231311147216959', '1034278601060777984', '1082421799578521620', '1020011442205900870'];

        if (triggeredChannels.some((chID) => message.channel.parent.id === chID)) {
            SUB.findOne({
                guildID: message.guild.id,
                postID: message.channel.id
            }, async (sErr, sData) => {
                if (sErr) return console.log(sErr);
                if (!sData) return;

                if ((sData.subbed.length > 0)) {
                    if (sData.op === message.author.id) {
                        if (sData.posted == false) {
                            for (let i = 0; i < sData.subbed.length; i++) {
                                client.users.cache.get(sData.subbed[i]).send(`📌 Your ${message.channel.parent.name} post "**${client.channels.cache.get(sData.postID).name || 'Unknown'}**" has received a response(s) from the poster.\n\nJump: ${message.url}`).catch((err) => { });
                            }

                            sData.posted = true;
                            await sData.save().catch((err) => console.log(err));
                        }
                    }

                    if (sData.subbed.includes(message.author.id)) {
                        if (sData.posted === true) {
                            sData.posted = false;
                            await sData.save().catch((err) => console.log(err));
                        }
                    }
                }
            });
        }

        /*
            Automatically applies the 'Being Helped' forum tag if a staff member replies to a thread in one of the following channels
            tech-support, vr-tech-support
        */
        const techChannels = ['1082421799578521620', '1020011442205900870'];

        if (cData.tagapply === true) {
            if (techChannels.some((chID) => message.channel.parent.id === chID)) {
                if ((execRoles.find((r) => staffRoles.includes(r.id)))) {
                    const parentChannel = message.channel.parent;
                    const currentAppliedTags = message.channel.appliedTags;

                    const beingHelpedTag = parentChannel.availableTags.find((tag) => tag.name.toLowerCase() === 'being helped');

                    if (beingHelpedTag) {
                        if (!(message.channel.appliedTags.some((tag) => tag.includes(beingHelpedTag.id)))) {
                            const tagsToApply = [];

                            for (let i = 0; i < currentAppliedTags.length; i++) {
                                tagsToApply.push(currentAppliedTags[i]);
                            }

                            tagsToApply.push(beingHelpedTag.id);

                            await message.channel.setAppliedTags(tagsToApply, 'Added the \'Being Helped\' tag automatically as a staff member replied.');
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
    });
}

async function createThread(message, title) {
    await message.channel.threads.create({
        startMessage: message.id,
        name: title,
        autoArchiveDuration: 10080,
        reason: 'Created thread automatically as member posted in a suggestion channel (#' + message.channel.name + ')'
    });
}