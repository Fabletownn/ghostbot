module.exports = async (Discord, client, member) => {

    if (member.guild === null) return;

    if (member.roles.cache.size > 1) {

        let memberID = member.user.id;
        let memberNameDiscrim = member.user.tag;

        const notifyRoles = ['761640195413377044', '759255791605383208', '756591038373691606'];
        const notifyUsers = ['338496408988418048', '219169741447626754', '177953924211408899', '366086664495562764'];

        const memberRoles = member.roles.cache;
        const roleNames = memberRoles.filter((role) => role.id !== member.guild.id).map((role) => role.name).join(', ');

        if (memberRoles.find((r) => notifyRoles.includes(r.id))) {

            for (let i = 0; i < notifyUsers.length; i++) {

                await client.users.cache.get(notifyUsers[i]).send(`⚠️ **Staff Leave Alert**\n\nA staff member has just left the server (<@${memberID || '???'}> | ${memberNameDiscrim || 'Unknown#0000'}).\n\nRoles: **${roleNames}**`).catch((err) => { return });

            }

        }

    }

}