const CONFIG = require('../../models/config.js');
const LCONFIG = require('../../models/logconfig.js');

module.exports = async (Discord, client, interaction) => {
    CONFIG.findOne({
        guildID: interaction.guild.id
    }, async (cErr, cData) => {
        if (cErr) return console.log(cErr);

        LCONFIG.findOne({
            guildID: interaction.guild.id
        }, async (lErr, lData) => {
            if (lErr) return console.log(lErr);

            ///////////////////////// Buttons
            if (interaction.isButton()) {
                switch (interaction.customId) {
                    case "setup-reset": {
                        if (cData) await cData.delete();
                        if (lData) await lData.delete();

                        const newData = new CONFIG({
                            guildID: interaction.guild.id,
                            autopublish: false,
                            threadcreate: false,
                            tagapply: false,
                            pbvcid: '',
                            pbvclimit: 4,
                            pullcategoryid: '',
                            pullroleid: '',
                            pulllogid: '',
                            pullmsg: '',
                            mmcategoryid: '',
                            ammcategoryid: ''
                        });

                        const newLogData = new LCONFIG({
                            guildID: interaction.guild.id,
                            deletechannel: '',
                            editchannel: '',
                            ignoredchannels: [],
                            ignoredcategories: [],
                            deletewebhook: '',
                            editwebhook: '',
                            usernamewebhook: '',
                            vcwebhook: '',
                            chanupwebhook: '',
                            usernamechannel: '',
                            vcchannel: '',
                            chanupchannel: ''
                        });

                        await newLogData.save().catch((err) => console.log(err));
                        await newData.save().catch((err) => console.log(err));

                        await interaction.update({ content: 'Data has been set back up for the server. Use the `/config` and `/log-config` commands to view and edit these values.', components: [] });
                        break;
                    }
                    case "setup-cancel":
                        await interaction.update({ content: 'Data will not be reset for the server.', components: [] });

                        break;
                    default:
                        break;
                }
            }

            ///////////////////////// Modals
            else if (interaction.isModalSubmit()) {
                switch (interaction.customId) {
                    case "say-modal":
                        const sayMessage = interaction.fields.getTextInputValue('say-msg');
                        const sayEmbed = new EmbedBuilder()
                            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 512 })})
                            .setDescription(`${interaction.user} ghostified a message in ${interaction.channel}`)
                            .addFields([
                                { name: 'Content', value: sayMessage }
                            ])
                            .setTimestamp()

                        await interaction.channel.send(sayMessage);
                        await interaction.guild.channels.cache.get(lData.chanupchannel).send({ embeds: [sayEmbed] });

                        await interaction.reply({ content: 'Your message has been ghostified.', ephemeral: true });

                        break;
                    default:
                        break;
                }
            }
        });
    });
};