const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder } = require('discord.js');
const CONFIG = require('../models/config.js');
const PULL = require('../models/pullrooms.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin-pull')
        .setDescription('Creates an Admin pullroom channel for the specified user')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption((option) =>
            option.setName('user')
                .setDescription('The user that will be pullroomed')
                .setRequired(true)
        ),
    async execute(interaction) {
        const userOption = interaction.options.getUser('user'); // User to be pullroomed
        if (userOption.id === interaction.user.id) return interaction.reply({ content: 'You cannot pullroom yourself.', flags: MessageFlags.Ephemeral });

        const adminDiscussion = '781985975844733029';                                  // Channel ID for the admin channel
        const adminDiscussionChannel = interaction.guild.channels.cache.get(adminDiscussion); // Admin channel object

        const cData = await CONFIG.findOne({ guildID: interaction.guild.id });                      // Get existing configuration data
        const pData = await PULL.findOne({ guildID: interaction.guild.id, userID: userOption.id }); // Get existing pullrooms data

        if (!cData) return interaction.reply({ content: 'I can\'t run that command if there is no data set up for the server! Use `/config-setup` first.' });
        if (!cData.pullroleid || !cData.pullcategoryid || !cData.pullmsg) return interaction.reply({ content: 'I can\'t run that command if there is no data set up for pullrooms! Use `/config-edit` first.' });
        if (pData) return interaction.reply({ content: `That user already has a pullroom session open in <#${pData.channelID}>.` });

        const pullCategory = interaction.guild.channels.cache.get(cData.pullcategoryid); // Pullroom category from configuration
        const pullMember = interaction.guild.members.cache.get(userOption.id);           // Member object for the person being pullroomed

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (pullCategory && pullMember) {
            const modifiedUsername = userOption.username.replace(/[^a-zA-Z0-9]+/g, '').toLowerCase(); // Modified username for Discord channel limitations
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
                    .setDescription(`${userOption.displayName} has been pulled.\n\n${cData.pullmsg}`)
                    .setColor('#FFFFFF');

                const newPullData = new PULL({
                    guildID: interaction.guild.id,
                    userID: userOption.id,
                    userTag: userOption.username,
                    channelID: pullroomChannel.id,
                    roomName: roomName,
                    transcript: `[${new Date().toLocaleString().replace(',', '')}] Admin pullroom started by ${interaction.user.username} with ${userOption.username} opened..\n`,
                    admin: true
                });

                await newPullData.save().catch((err) => trailError(err));

                // Add the pullroom role
                await pullMember.roles.add(cData.pullroleid);
                // Disconnect them from any connected voice channels
                await pullMember.voice.setChannel(null, { reason: 'Disconnected from voice channel as pullroomed' });
                // Send pullroom messages and followup to command
                await pullroomChannel.send({ content: `The Admin team would like to speak to you, <@${userOption.id}>.`, embeds: [pullEmbed] });
                await pullroomChannel.send({ content: `<@${interaction.user.id}>` }).then((m) => m.delete());
                await interaction.followUp({ content: `Created an Admin pullroom for <@${userOption.id}> into <#${newPullData.channelID}>.` });
                if (adminDiscussionChannel) await adminDiscussionChannel.send({ content: `🪢 <@${userOption.id}> ${pullMember ? `(${pullMember.user.username}) ` : ''}was Admin pullroomed by ${interaction.user.username}` });
            });
        } else {
            return interaction.followUp({ content: 'The pullroom category no longer exists, or the member has left the server.' });
        }
    },
};