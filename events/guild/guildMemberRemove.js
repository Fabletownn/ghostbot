/*
    Checks if a leaving member has a staff member role
    If a staff member left the server, it will individually message each Admin to let them know
*/
module.exports = async (Discord, client, member) => {
    if (member.guild === null) return;

    if (member.roles.cache.size > 1) {
        const memberID = member.user.id;
        const memberName = member.user.username;

        const notifyRoles = ['761640195413377044', '759255791605383208', '756591038373691606'];
        const notifyUsers = ['338496408988418048', '528759471514845194', '366086664495562764'];

        const memberRoles = member.roles.cache;
        const roleNames = memberRoles.filter((role) => role.id !== member.guild.id).map((role) => role.name).join(', ');

        if (memberRoles.find((r) => notifyRoles.includes(r.id))) {
            for (let i = 0; i < notifyUsers.length; i++) {
                await member.guild.members.fetch(notifyUsers[i]).then(async () => {
                    await client.users.cache.get(notifyUsers[i]).send(`⚠️ **Staff Leave Alert**\n\nA staff member has just left the server (<@${memberID || '???'}> | ${memberName || 'Unknown'}).\n\nRoles: **${roleNames}**`).catch((err) => {
                        return
                    });
                }).catch((err) => {
                    return;
                });
            }
        }
    }
}