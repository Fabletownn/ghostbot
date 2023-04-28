const KICKS = require('../../models/kicks.js');

module.exports = async (Discord, client, member) => {

    KICKS.findOne({

        guildID: member.guild.id,
        userID: member.user.id
        
    }, async (err, data) => {

        if (err) return console.log(err);

        if (data) {

            await client.channels.cache.get('805795819722244148').send(`📥 User <@${member.user.id}> (originally named **${data.username}**) returned after a kick for their profile picture. Please double check if their profile has been changed accordingly.`);

            await data.delete();

        }

    });

}