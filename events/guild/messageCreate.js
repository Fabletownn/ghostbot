const { Client, ChannelType } = require('discord.js');
const CONFIG = require('../../models/config.js');

module.exports = async (Discord, client, message) => {

    if (message.author.bot) return;
    if (message.guild === null) return;

    if (message.guild.id !== '435431947963990026') return;

    /*
        Used for not executing a commannd if the user doesn't have one of the below roles
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
        if (message.channel.type == ChannelType.GuildAnnouncement) {

            if (data) {

                if ((message.crosspostable) && data.autopublish === true) {

                    await message.crosspost();

                    console.log(`Published message in #${message.channel.name} by user ${message.author.tag}`);

                }

            }

        }

        /*
            Security/moderation measure for username or impersonation tracking
            Lists last 3 username changes from the past week once they're looked up
        */
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
                            let nameList = `${data.usernames.toString().replace(/,/g, ', ')}, ${client.users.cache.get(args[0]).username}`;

                            let userMention = `<@${args[0]}>`;
                            let userTag = client.users.cache.get(args[0]).tag;

                            let fullUserInfo = `${userMention} (${userTag} \`${args[0]}\`)`;

                            if (data.usernames.length >= 3) nameCount = 'several';
                            if (data.usernames.length < 3) nameCount = data.usernames.length;

                            message.channel.awaitMessages({
                                waitFilter,
                                max: 2,
                                time: 180_000,
                                errors: ['time']
                            }).then((collected) => {

                                setTimeout(() => message.channel.send(`${fullUserInfo} has had ${nameCount} prior username(s) this week\n\nRecent username history: ${nameList}`), 1000);

                            }).catch((collected) => {});

                        }

                    });

                });

            }

        }

    });

};