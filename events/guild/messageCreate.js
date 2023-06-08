const { Client, ChannelType } = require('discord.js');
const UNAME = require('../../models/username.js');
const CONFIG = require('../../models/config.js');
const SUB = require('../../models/subs.js');
const KICKS = require('../../models/kicks.js');
const PULL = require('../../models/pullrooms.js');

module.exports = async (Discord, client, message) => {

    if (message.author.bot) return;
    if (message.guild === null) return;

    if (message.guild.id !== '435431947963990026') return;

    /*
        Used for not executing a command if the user doesn't have one of the below roles
        Community Helper, Trial Mod, Moderator, Admin, Kinetic Games
    */
    const staffRoles = ['761640195413377044', '759255791605383208', '756591038373691606', '759265333600190545', '749029859048816651'];
    const adminRoles = ['759265333600190545', '749029859048816651', '761412136794456085'];
    const modRoles = ['756591038373691606', '759265333600190545', '749029859048816651', '759255791605383208'];

    const execRoles = message.member.roles.cache;

    CONFIG.findOne({

        guildID: message.guild.id

    }, async (err, data) => {

        if (err) return console.log(err);

        /*
            Automatically sets the bot's prefix depending on data
            "!config prefix <>" changes this
        */
        let prefix;

        if (!data) prefix = '!';
        if (data) prefix = data.prefix;

        const args = message.content.slice(prefix.length).split(/ +/);

        const commandArgs = args.shift().toLowerCase();
        const command = client.commands.get(commandArgs) || client.commands.find(a => a.aliases && a.aliases.includes(commandArgs));

        if (command && message.content.startsWith(prefix)) {

            if ((command.category == 'admin') && (execRoles.find((r) => adminRoles.includes(r.id)))) command.execute(client, message, args, Discord);
            if ((command.category == 'mod') && (execRoles.find((r) => modRoles.includes(r.id)))) command.execute(client, message, args, Discord);
            if ((command.category == 'staff') && (execRoles.find((r) => staffRoles.includes(r.id)))) command.execute(client, message, args, Discord);
            if ((command.category == 'user')) command.execute(client, message, args, Discord);

        }

        /*
            Automatically publishes messages posted in announcement channels
            "!config autopublish off" disables this
        */
        if (message.channel.type === ChannelType.GuildAnnouncement) {

            if (data) {

                if ((message.crosspostable) && (data.autopublish == true)) {

                    await message.crosspost();

                }

            }

        }

        /*
            Used for logging messages sent in pullroom sessions
            "!config pullroom_logs <channel>" changes where this gets sent
        */
        if (data) {

            if (message.channel.parent.id === data.pullcategoryid) {

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

        }

    });

    /*
        Security/moderation measure for username or impersonation tracking
        Lists last 3 username changes from the past week once they're looked up
    */
    const args = message.content.split(' ');

    if ((message.content.startsWith('-www')) && (args[0]) && (!isNaN(args[0]))) {

        if ((execRoles.find((r) => modRoles.includes(r.id)))) {

            message.guild.members.fetch(args[0]).then(() => {

                UNAME.findOne({

                    userID: args[0]

                }, (err, data) => {

                    if (err) return console.log(err);

                    if (data) {

                        const waitFilter = m => m.author.bot;

                        let nameCount;
                        const nameList = `${data.usernames.toString().replace(/,/g, ', ')}, ${client.users.cache.get(args[0]).username}`;

                        const userMention = `<@${args[0]}>`;
                        const userTag = client.users.cache.get(args[0]).username;

                        const fullUserInfo = `${userMention} (${userTag} \`${args[0]}\`)`;

                        if (data.usernames.length >= 3) nameCount = 'several';
                        if (data.usernames.length < 3) nameCount = data.usernames.length;

                        message.channel.awaitMessages({
                            waitFilter,
                            max: 2,
                            time: 180_000,
                            errors: ['time']
                        }).then((collected) => {

                            setTimeout(() => message.channel.send(`${fullUserInfo} has had ${nameCount} prior username(s) this week\n\nRecent username history: ${nameList}`), 1000);

                        }).catch((collected) => { });

                    }

                });

            }).catch((err) => {

                return;

            });

        }

    }

    /*
        Tracks users who have been kicked for their profile pictures
        Sends a message in #ch-reports when they rejoin the server
    */
    if ((message.content.match(/^(-kick)/g) && message.content.match(/(profile pic|avatar|pfp)/g)) && (args[1]) && (!isNaN(args[1]))) {

        if (!client.users.cache.get(args[1])) return;

        KICKS.findOne({

            guildID: message.guild.id,
            userID: args[1]

        }, async (err, data) => {

            if (err) return console.log(err);

            if (!data) {

                const newTrackerData = new KICKS({
                    guildID: message.guild.id,
                    userID: args[1],
                    username: client.users.cache.get(args[1]).username
                });

                await newTrackerData.save().catch((err) => console.log(err));

                await message.react('👁️');

            }

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

        }, async (err, data) => {

            if (err) return console.log(err);
            if (!data) return;

            if ((data.subbedMembers.length > 0)) {

                if (data.originalPoster === message.author.id) {

                    if (data.alreadyPosted == false) {

                        for (let i = 0; i < data.subbedMembers.length; i++) {

                            client.users.cache.get(data.subbedMembers[i]).send(`<:PhasPin2:1091053595916517448> Your ${message.channel.parent.name} post <#${data.postID}> has received a response(s) from the poster.\n\nJump: ${message.url}`).catch((err) => { });

                        }

                        data.alreadyPosted = true;
                        await data.save().catch((err) => console.log(err));

                    }

                }

                if (data.subbedMembers.includes(message.author.id)) {

                    if (data.alreadyPosted == true) {

                        data.alreadyPosted = false;
                        await data.save().catch((err) => console.log(err));

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

    /*
       Automatically creates a thread under messages in suggestion channels
       suggestion-voting, staff-candidate-voting, content-creator-suggestions, cc-voting
    */
    const suggestionChannels = ['771924501645754408', '762935209377005569', '973337178979598406', '1052149463675846686'];

    let threadTitle = message.author.username;

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

            case '973337178979598406':
                threadTitle += ' - Suggestion Discussion';

                createThread(message, threadTitle);
                break;

            case '1052149463675846686':
                threadTitle += ' - Suggestion Discussion';

                createThread(message, threadTitle);
                break;

            default:
                threadTitle += ' - Discussion';

                createThread(message, threadTitle);
                break;

        }

    }

};

async function createThread(message, title) {

    await message.channel.threads.create({

        startMessage: message.id,
        name: title,
        autoArchiveDuration: 10080,
        reason: 'Created thread automatically as member posted in a suggestion channel.'

    });

}