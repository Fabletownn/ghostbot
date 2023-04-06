const UNAME = require('../models/username.js');
const fc = require('../handlers/global_functions.js');

module.exports = {
    name: 'names',
    aliases: ['usernames', 'namehistory', 'usernamehistory'],
    description: 'This command provides the 3 most recent username changes from a member in the past week if any',
    category: 'staff',
    syntax: 'names <user>',
    async execute(client, message, args) {

        if (!args[0]) return fc.InsufficientArgs(message, 1, args, module.exports.syntax);

        const reqArg = args[0];
        const userSearch = message.mentions.users.first() || client.users.cache.get(reqArg);

        if (!userSearch || !message.guild.members.cache.get(userSearch.id)) return message.reply('Invalid user, or user not found. Please make sure the user exists and is in the server.');

        message.guild.members.fetch(userSearch.id).then(() => {

            UNAME.findOne({

                userID: userSearch.id

            }, async (err, data) => {

                if (err) return console.log(err);

                if (data) {

                    let nameCount;
                    const nameList = `${data.usernames.toString().replace(/,/g, ', ')}, ${client.users.cache.get(userSearch.id).username}`;

                    const userMention = `<@${userSearch.id}>`;
                    const userTag = client.users.cache.get(userSearch.id).tag;

                    const fullUserInfo = `${userMention} (${userTag} \`${userSearch.id}\`)`;

                    if (data.usernames.length >= 3) nameCount = 'several';
                    if (data.usernames.length < 3) nameCount = data.usernames.length;

                    await message.reply(`${fullUserInfo} has had ${nameCount} prior username(s) this week\n\nRecent username history: ${nameList}`);

                } else {

                    await message.reply('No username history found for this past week. No data found, or changes may have not been detected yet.');

                }

            });

        });

    }

};