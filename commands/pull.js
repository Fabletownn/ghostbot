const CONFIG = require('../models/config.js');
const PULL = require('../models/pullrooms.js');
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pull')
        .setDescription('(Moderator) Creates a pullroom channel for the specified user')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption((option) =>
            option.setName('user')
                .setDescription('The user that will be pullroomed')
                .setRequired(true)
        ),
    async execute(interaction) {
        const userOption = interaction.options.getUser('user');

        if (userOption.id === interaction.user.id) return interaction.reply({ content: 'Find a friend to pullroom, not yourself!' });

        CONFIG.findOne({
            guildID: interaction.guild.id
        }, async (err, cData) => {
            if (err) return interaction.reply({ content: `Failed to pullroom that user!\n\`${err}\`` });
            if (!cData) return interaction.reply({ content: 'I can\'t run that command if there is no data set up for the server! Use `/config-setup` first.' });

            PULL.findOne({
                guildID: interaction.guild.id,
                userID: userOption.id
            }, async (pErr, pData) => {
                if (pErr) return console.log(pErr);
                if (pData) return interaction.reply({ content: `That user already has a pullroom session open in <#${pData.channelID}>.` });

                const pullCategory = interaction.guild.channels.cache.get(cData.pullcategoryid);
                const pullMember = interaction.guild.members.cache.get(userOption.id);

                await interaction.deferReply();

                if (pullCategory && pullMember) {
                    const modifiedUsername = userOption.username.replace(/[^a-zA-Z]+/g, '').toLowerCase();
                    const roomName = `pullroom-${modifiedUsername}`;

                    await interaction.guild.channels.create({
                        name: roomName,
                        topic: `User ID: ${userOption.id}`,
                        parent: pullCategory.id,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.id,
                                deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory]
                            },
                            {
                                id: userOption.id,
                                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks]
                            },
                            {
                                id: '756591038373691606', // Moderator
                                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ManageChannels]
                            },
                            {
                                id: '759255791605383208', // Trial Mod
                                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ManageChannels]
                            }
                        ]
                    }).then(async (pullroomChannel) => {
                        await pullroomChannel.setPosition(0);

                        const pullEmbed = new EmbedBuilder()
                            .setAuthor({
                                name: userOption.username + ' Pullroom',
                                iconURL: userOption.displayAvatarURL({
                                    dynamic: true
                                })
                            })
                            .setDescription(`${userOption.displayName} has been pulled by ${interaction.user.displayName}.\n\n${cData.pullmsg}`)
                            .setColor('ffffff');

                        const newPullData = new PULL({
                            guildID: interaction.guild.id,
                            userID: userOption.id,
                            userTag: userOption.username,
                            channelID: pullroomChannel.id,
                            roomName: roomName,
                            transcript: `[${new Date().toLocaleString().replace(',', '')}] Pullroom started by ${interaction.user.username} with ${userOption.username} opened..\n`
                        });

                        await newPullData.save().catch((err) => console.log(err));

                        await pullMember.roles.add(cData.pullroleid);

                        await pullroomChannel.send({ content: `A member of the moderation team would like to speak to you, <@${userOption.id}>.`, embeds: [pullEmbed] });
                        await pullroomChannel.send({ content: `<@${interaction.user.id}>` }).then((m) => m.delete());
                        await interaction.followUp({ content: `Pulled <@${userOption.id}> into <#${newPullData.channelID}> successfully.` });
                    });
                } else {
                    return interaction.followUp({ content: 'The pullroom category no longer exists, or the member has left the server. Rare find!' });
                }
            });
        });
    },
};