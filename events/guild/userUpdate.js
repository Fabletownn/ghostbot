const UNAME = require('../../models/username.js');

module.exports = async (Discord, client, oldUser, newUser) => {

    if (oldUser.username !== newUser.username) {

        const oldUsername = oldUser.username;
        const newUsername = newUser.username;

        if ((!oldUser.partial) && (oldUsername !== null && newUsername !== null)) {

            if ((oldUsername !== newUsername)) {

                UNAME.findOne({

                    userID: newUser.id

                }, (err, data) => {

                    if (err) return console.log(err);
                    
                    if (!data) {

                        const newUserData = new UNAME({
                            guildID: '435431947963990026',
                            userID: newUser.id,
                            usernames: [oldUsername],
                            expireOn: Date.now() + 1000 * 60 * 60 * 168
                        });

                        newUserData.save().catch((err) => console.log(err));

                    } else if (data) {

                        if (data.usernames.length >= 3) {

                            data.usernames.shift();
                            data.usernames.push(oldUsername);
                            
                            data.save().catch((err) => console.log(err));

                        } else {

                            data.usernames.push(oldUsername);
                            
                            data.save().catch((err) => console.log(err));

                        }

                    }

                });

                if (newUsername.match(/(fa..ot|ni..er|ni..a|卐|卍|adolf|hitler)/gmi)) {

                    client.channels.cache.get('1067061056867938386').send(`⚠️ Potentially **harmful profile** has been detected (username change).\n\nUser: <@${newUser.id}> (${newUser.id})\nUsername: \`${newUsername}\`, previously being named \`${oldUsername}\``);

                }

            }

        }

    }

};