module.exports = {
    name: 'steam',
    aliases: ['steammod', 'steammoderator'],
    description: 'This command allows Steam Moderators to see ModMail tickets',
    category: 'mod',
    syntax: 'steam',
    async execute(client, message) {

        const execCategoryID = message.channel.parent.id;

        const mmticketCategoryID = '1043688169851338872';
        const amticketCategoryID = '1001261709882818691';

        const steamModeratorRoleID = '766063761060528138';

        if (execCategoryID == mmticketCategoryID || execCategoryID == amticketCategoryID) {

            await message.channel.permissionOverwrites.edit(steamModeratorRoleID, {

                ViewChannel: true,
                ReadMessageHistory: true,
                SendMessages: true,
                AttachFiles: true
                
            });

            await message.react('✅');

        } else {

            await message.react('❓');

        }

    }

};