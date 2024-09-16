const { ButtonStyle, ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require('discord.js');
const CONFIG = require('../../models/config.js');
const LCONFIG = require('../../models/logconfig.js');
const { MET } = require('bing-translate-api');

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
                    case "flag-delete":
                        let flagEmbed = interaction.message.embeds[0];
                        const flagFields = flagEmbed.fields;
                        const flagFooter = flagEmbed.footer.text;
                        const flagMessageID = flagFooter.split(' ')[2];
                        const flagChannelID = flagFields[1].value.replace(/[<#>]/g, '');
                        const flagChannel = interaction.guild.channels.cache.get(flagChannelID);

                        if (!flagChannel) return interaction.reply({ content: 'Unable to delete the message, the channel or post this message was sent in is no longer available.' });

                        await flagChannel.messages.fetch(flagMessageID).then(async (flagmsg) => {
                            const handledEmbed = EmbedBuilder.from(flagEmbed).setColor('#38DD86').setAuthor({ name: 'Flag Handled', iconURL: 'https://i.imgur.com/7WEoXUM.png' });

                            await flagmsg.delete();
                            await interaction.message.edit({ embeds: [handledEmbed], components: [] });
                            await interaction.reply({ content: 'Deleted the message.', ephemeral: true });
                        }).catch((err) => { return interaction.reply({ content: 'Unable to delete the message, does it exist?', ephemeral: true }) });

                        break;
                    case "flag-handle":
                        let flagEmbed2 = interaction.message.embeds[0];
                        const handledEmbed = EmbedBuilder.from(flagEmbed2).setColor('#38DD86').setAuthor({ name: 'Flag Handled', iconURL: 'https://i.imgur.com/7WEoXUM.png' });

                        await interaction.message.edit({ embeds: [handledEmbed], components: [] });
                        await interaction.reply({ content: 'Marked the flag as handled.', ephemeral: true });
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
                            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 512 }) })
                            .setDescription(`${interaction.user} ghostified a message in ${interaction.channel}`)
                            .addFields([
                                { name: 'Content', value: sayMessage.slice(0, 1020) }
                            ])
                            .setTimestamp()

                        await interaction.channel.send({ content: sayMessage });
                        await interaction.guild.channels.cache.get(lData.chanupchannel).send({ embeds: [sayEmbed] });

                        await interaction.reply({ content: 'Your message has been ghostified.', ephemeral: true });

                        break;
                    default:
                        break;
                }
            }

            ///////////////////////// Message Context Interactions
            else if (interaction.isMessageContextMenuCommand()) {
                switch (interaction.commandName) {
                    case "Flag Message":
                    case "Flag Message (Emergency)":
                        const flaggedMessage = interaction.targetMessage;
                        const msgAuthor = flaggedMessage.author;
                        const msgContent0 = flaggedMessage.content;
                        const msgContent1 = msgContent0.length > 800 ? `${msgContent0.slice(0, 800)}...` : msgContent0;
                        const msgContent = msgContent1.replace(/[`]/g, '');
                        const msgCreated = Math.round(flaggedMessage.createdAt / 1000);
                        const flagCreated = Math.round(Date.now() / 1000);
                        const msgAttachs = Array.from(flaggedMessage.attachments.values());
                        const msgAttachment = (msgAttachs.length > 0 ? msgAttachs[0].url : null);
                        const isEmergency = interaction.commandName === 'Flag Message (Emergency)';
                        const flagEmergency = (isEmergency ? '<@&756591038373691606> A message has been flagged as an emergency!' : null);

                        const flagEmbed = new EmbedBuilder()
                            .setAuthor({ name: `Unhandled Flag`, iconURL: 'https://i.imgur.com/rSqII8d.png' })
                            .addFields([
                                { name: 'User', value: `${msgAuthor}\n(${msgAuthor.id})`, inline: true },
                                { name: 'Channel', value: `<#${interaction.channel.id}>`, inline: true },
                                { name: 'Message', value: `**[Jump](${flaggedMessage.url})**`, inline: true },
                                { name: 'Content', value: `\`\`\`${msgContent || 'No Content (File/Sticker)'}\`\`\``, inline: false },
                                { name: 'Posted', value: `<t:${msgCreated}:R>`, inline: true },
                                { name: 'Flagged', value: `<t:${flagCreated}:R>`, inline: true }
                            ])
                            .setFooter({ text: `Message ID: ${flaggedMessage.id}  •  Flagged by ${interaction.user.username}` })
                            .setThumbnail(msgAuthor.displayAvatarURL({ dynamic: true, size: 1024 }))
                            .setImage(msgAttachment)
                            .setColor('#FF756E')

                        const flagRow = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('flag-handle')
                                    .setLabel('Mark Handled')
                                    .setStyle(ButtonStyle.Success),
                            )
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('flag-delete')
                                    .setLabel('Delete Message')
                                    .setStyle(ButtonStyle.Danger),
                            );

                        await interaction.guild.channels.cache.get('805795819722244148').send({ content: flagEmergency, embeds: [flagEmbed], components: [flagRow], allowedMentions: { parse: ['roles'] } }).then((flag) => {
                            interaction.reply({ content: `Flagged the message${(isEmergency ? ' as an emergency' : '')}: [jump to your report here](<${flag.url}>)!`, ephemeral: true });
                        });
                        
                        break;
                    case "Translate Message":
                        let translatedMessage = interaction.targetMessage.content;

                        await interaction.deferReply({ ephemeral: true });

                        if (interaction.targetMessage.embeds.length > 0)  {
                            if (interaction.targetMessage.embeds[0].fields[0]) {
                                const fieldValue = interaction.targetMessage.embeds[0].fields[0].value;

                                if (fieldValue) translatedMessage = fieldValue;
                            }
                        }

                        if (!translatedMessage || translatedMessage === "") {
                            await interaction.followUp({ content: 'The selected message has no content to translate.', ephemeral: true });
                            return;
                        }

                        MET.translate(translatedMessage, null, 'en').then(async (res) => {
                            const detectedLanguage = res[0].detectedLanguage.language;
                            const translatedContent = res[0].translations[0].text;

                            if (detectedLanguage === 'en') {
                                await interaction.followUp({ content: 'The selected message is already in English, and translations are only provided for messages in other languages.',  ephemeral: true });
                                return;
                            }

                            await interaction.followUp({ content: `**Detected Language**: \`${detectedLanguage.toUpperCase()}\`\n**Translated Content**: \`${translatedContent}\``, ephemeral: true });
                        }).catch((err) => {
                            console.log(err);
                            return interaction.followUp({ content: `Failed to translate that message! If this is a mistake, please forward this error: \`${err}\``, ephemeral: true });
                        });
                        
                        break;
                    default:
                        break;
                }
            }
        });
    });
};