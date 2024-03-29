module.exports = {
    name: 'unsteam',
    aliases: ['unsteammod', 'unsteammoderator'],
    description: 'Removes Steam Moderator access from a hoisted ModMail ticket',
    category: 'mod',
    syntax: 'unsteam',
    async execute(client, message) {
        const execCategoryID = message.channel.parent.id;

        const mmticketCategoryID = '1043688169851338872';
        const amticketCategoryID = '1001261709882818691';

        const steamModeratorRoleID = '766063761060528138';

        if (execCategoryID == mmticketCategoryID || execCategoryID == amticketCategoryID) {
            await message.channel.permissionOverwrites.delete(steamModeratorRoleID);
            await message.react('✅');
        } else {
            await message.react('❓');
        }
    }
};