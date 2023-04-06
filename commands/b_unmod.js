module.exports = {
    name: 'unmod',
    aliases: ['movedown'],
    description: 'This command moves the current ModMail thread down to Modmail Tickets',
    category: 'staff',
    syntax: 'unmod',
    async execute(client, message, args) {

        const execCategoryID = message.channel.parent.id;

        const ticketCategoryID = '1001261709882818691';
        const moveCategoryID = '1043688169851338872';

        if (execCategoryID == ticketCategoryID) {

            await message.channel.setParent(moveCategoryID);
            await message.react('✅');

        } else {

            await message.react('❓');

        }

    }

};