const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const CONFIG = require('../models/config.js');
const PULL = require('../models/pullrooms.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pull')
        .setDescription('Creates a pullroom channel for the specified user')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption((option) =>
            option.setName('user')
                .setDescription('The user that will be pullroomed')
                .setRequired(true)
        ),
    async execute(interaction) {
        const userOption = interaction.options.getUser('user'); // User to be pullroomed
        const userReports = '805795819722244148';          // Channel ID for the user reports channel
        const userReportsChannel = interaction.guild.channels.cache.get(userReports); // User reports channel object

        if (userOption.id === interaction.user.id) return interaction.reply({ content: 'Find a friend to pullroom, not yourself!' });

        const cData = await CONFIG.findOne({ guildID: interaction.guild.id });                      // Get existing configuration data
        const pData = await PULL.findOne({ guildID: interaction.guild.id, userID: userOption.id }); // Get existing pullrooms data

        if (!cData) return interaction.reply({ content: 'I can\'t run that command if there is no data set up for the server! Use `/config-setup` first.' });
        if (!cData.pullroleid || !cData.pullcategoryid || !cData.pullmsg) return interaction.reply({ content: 'I can\'t run that command if there is no data set up for pullrooms! Use `/config-edit` first.' });
        if (pData) return interaction.reply({ content: `That user already has a pullroom session open in <#${pData.channelID}>.` });

        const pullCategory = interaction.guild.channels.cache.get(cData.pullcategoryid); // Pullroom category from configuration
        const pullMember = interaction.guild.members.cache.get(userOption.id);           // Member object for the person being pullroomed

        await interaction.deferReply();

        if (pullCategory && pullMember) {
            const modifiedUsername = userOption.username.replace(/[^a-zA-Z]+/g, '').toLowerCase(); // Modified username for Discord channel limitations
            const roomName = `pullroom-${modifiedUsername}`;

            // Create a pullroom channel with the room name and permission overwrites
            await interaction.guild.channels.create({
                name: roomName,
                topic: `User ID: ${userOption.id}`,
                parent: pullCategory.id,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id, // @everyone
                        deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory]
                    },
                    {
                        id: userOption.id, // The user being pulled
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks]
                    },
                    {
                        id: '756591038373691606', // Moderator
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ManageChannels]
                    },
                    {
                        id: '759255791605383208', // Trial Moderator
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ManageChannels]
                    }
                ]
            }).then(async (pullroomChannel) => {
                await pullroomChannel.setPosition(0); // Set the channel to the top of the category

                const pullEmbed = new EmbedBuilder()
                    .setAuthor({
                        name: userOption.username + ' Pullroom',
                        iconURL: userOption.displayAvatarURL({
                            dynamic: true
                        })
                    })
                    .setDescription(`${userOption.displayName} has been pulled by ${interaction.user.displayName}.\n\n${cData.pullmsg}`)
                    .setColor('#FFFFFF');

                const newPullData = new PULL({
                    guildID: interaction.guild.id,
                    userID: userOption.id,
                    userTag: userOption.username,
                    channelID: pullroomChannel.id,
                    roomName: roomName,
                    transcript: `[${new Date().toLocaleString().replace(',', '')}] Pullroom started by ${interaction.user.username} with ${userOption.username} opened..\n`
                });

                await newPullData.save().catch((err) => console.log(err));

                // Add the pullroom role
                await pullMember.roles.add(cData.pullroleid);
                // Disconnect them from any connected voice channels
                await pullMember.voice.setChannel(null, { reason: 'Disconnected from voice channel as pullroomed' });
                // Send pullroom messages and followup to command
                await pullroomChannel.send({ content: `A member of the moderation team would like to speak to you, <@${userOption.id}>.`, embeds: [pullEmbed] });
                await pullroomChannel.send({ content: `<@${interaction.user.id}>` }).then((m) => m.delete());
                await interaction.followUp({ content: `Pulled <@${userOption.id}> into <#${newPullData.channelID}>.` });
                if (userReportsChannel) await userReportsChannel.send({ content: `🪢 <@${userOption.id}> ${pullMember ? `(${pullMember.user.username}) ` : ''}was pullroomed by ${interaction.user.username}` });
            });
        } else {
            return interaction.followUp({ content: 'The pullroom category no longer exists, or the member has left the server. Rare find!' });
        }
    },
};