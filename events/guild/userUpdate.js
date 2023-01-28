module.exports = async (Discord, client, oldUser, newUser) => {

    if (oldUser.username !== newUser.username) {

        const oldUsername = oldUser.username;
        const newUsername = newUser.username;

        if ((oldUsername !== null) && (newUsername !== null)) {

            if (newUsername.match(/(fa..ot|ni..er|ni..a|卐|卍|adolf|hitler)/gmi)) {

                client.channels.cache.get('1067061056867938386').send(`⚠️ Potentially **harmful profile** has been detected (username change).\n\nUser: <@${newUser.id}> (${newUser.id})\nUsername: \`${newUsername}\`, previously being named \`${oldUsername}\``);

            }

        }

    }

};