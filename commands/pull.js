const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getChannel, getMember } = require('../utils/fetch-utils.js');
const PULL = require('../models/pullrooms.js');
const SV = require('../models/server-values.json');

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
        if (userOption.id === interaction.user.id) return interaction.reply({ content: 'You cannot pullroom yourself.' });
        
        const userReportsChannel = await getChannel(interaction.guild, SV.CHANNELS.USER_REPORTS); // User reports channel object

        // Get and check existing configuration and pullroom data
        const cData = interaction.client.cachedConfig;
        const pData = await PULL.findOne({ guildID: interaction.guild.id, userID: userOption.id });
        
        if (!cData?.pullroleid || !cData?.pullcategoryid || !cData?.pullmsg)
            return interaction.reply({ content: 'There is no data set up for pullrooms yet!' });
        if (pData)
            return interaction.reply({ content: `That user already has a pullroom session open in <#${pData.channelID}>.` });

        await interaction.deferReply();

        const pullCategory = await getChannel(interaction.guild, cData.pullcategoryid); // Pullroom category from configuration
        const pullMember = await getMember(interaction.guild, userOption.id);      // Member object for the person being pullroomed

        if (pullCategory && pullMember) {
            const modifiedUsername = userOption.username.replace(/[^a-zA-Z0-9]+/g, '').toLowerCase(); // Modified username for Discord channel limitations
            const roomName = `pullroom-${modifiedUsername}`;

            // Create a pullroom channel with the room name and permission overwrites
            const pullroomChannel = await interaction.guild.channels.create({
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
                        id: SV.ROLES.TRIAL_MODERATOR, // Trial Moderator
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ManageChannels]
                    },
                    {
                        id: SV.ROLES.MODERATOR, // Moderator
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ManageChannels]
                    }
                ]
            });

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
                transcript: `[${new Date().toLocaleString().replace(',', '')}] Pullroom started by ${interaction.user.username} with ${userOption.username} opened..\n`,
                admin: false
            });
            
            await Promise.all([
                newPullData.save(), // Save pullroom data
                pullroomChannel.setPosition(0), // Set the channel to the top of the category
                pullMember.roles.add(cData.pullroleid), // Add the pulled role
                pullMember.voice.setChannel(null, { reason: 'Disconnected from voice channel as pullroomed' }) // Disconnect from any voice channels
            ]);

            await pullroomChannel.send({ content: `A member of the moderation team would like to speak to you, <@${userOption.id}>.`, embeds: [pullEmbed] });
            
            // Send pullroom messages and followup to command
            await interaction.followUp({ content: `Pulled <@${userOption.id}> into <#${newPullData.channelID}>.` });
            if (userReportsChannel) await userReportsChannel.send({ content: `🪢 <@${userOption.id}> ${pullMember ? `(${pullMember.user.username}) ` : ''}was pullroomed by ${interaction.user.username}` });
        } else {
            return interaction.followUp({ content: 'The pullroom category no longer exists, or the member has left the server.' });
        }
    },
};