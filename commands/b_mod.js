module.exports = {
    name: 'mod',
    aliases: ['moveup'],
    description: 'This command moves the current ModMail thread up to Admin/Mod Tickets',
    category: 'staff',
    syntax: 'mod',
    async execute(client, message, args) {

        let execCategoryID = message.channel.parent.id;

        let ticketCategoryID = '1043688169851338872';
        let moveCategoryID = '1001261709882818691';

        if (execCategoryID == ticketCategoryID) {

            await message.channel.setParent(moveCategoryID);
            await message.react('✅');

        } else {

            await message.react('❓');

        }

    }

};