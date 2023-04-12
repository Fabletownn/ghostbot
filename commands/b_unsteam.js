module.exports = {
    name: 'unsteam',
    aliases: ['unsteammod', 'unsteammoderator'],
    description: 'This command removes Steam Moderator access from a ModMail ticket',
    category: 'mod',
    syntax: 'unsteam',
    async execute(client, message) {

        const execCategoryID = message.channel.parent.id;

        const ticketCategoryID = '1043688169851338872';
        const steamModeratorRoleID = '766063761060528138';

        if (execCategoryID == ticketCategoryID) {

            await message.channel.permissionOverwrites.delete(steamModeratorRoleID);
            await message.react('✅');

        } else {

            await message.react('❓');

        }

    }

};