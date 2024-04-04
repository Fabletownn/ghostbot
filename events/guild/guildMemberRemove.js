/*
    Checks if a leaving member has a staff member role
    If a staff member left the server, it will send a message in the Admin chat
*/
module.exports = async (Discord, client, member) => {
    if (member.guild === null) return;

    if (member.roles.cache.size > 1) {
        const memberID = member.user.id;
        const memberName = member.user.username;

        const adminChat = '781985975844733029';
        const notifyRoles = ['761640195413377044', '759255791605383208', '756591038373691606'];

        const memberRoles = member.roles.cache;
        const roleNames = memberRoles.filter((role) => role.id !== member.guild.id).map((role) => role.name).join(', ');

        if (memberRoles.find((r) => notifyRoles.includes(r.id))) {
            client.channels.cache.get(adminChat).send({ content: `⚠️ **Staff Leave Alert**\n\nA staff member has just left the server (<@${memberID || '???'}> | ${memberName || 'Unknown'}).\n\nRoles: **${roleNames}**` });
        }
    }
}