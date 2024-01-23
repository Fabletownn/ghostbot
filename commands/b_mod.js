module.exports = {
    name: 'mod',
    aliases: ['moveup'],
    description: 'Moves the current ModMail thread up to Admin/Mod Tickets',
    category: 'staff',
    syntax: 'mod',
    async execute(client, message) {
        const execCategoryID = message.channel.parent.id;

        const ticketCategoryID = '1043688169851338872';
        const moveCategoryID = '1001261709882818691';

        if (execCategoryID == ticketCategoryID) {
            await message.channel.setParent(moveCategoryID);
            await message.react('✅');
        } else {
            await message.react('❓');
        }
    }
};