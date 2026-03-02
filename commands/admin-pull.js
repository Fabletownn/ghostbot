const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder } = require('discord.js');
const { getChannel, getMember } = require('../utils/fetch-utils.js');
const { channelText } = require('../utils/message-utils.js');
const PULL = require('../models/pullrooms.js');
const SV = require('../models/server-values.json');

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
        if (userOption.id === interaction.user.id)
            return interaction.reply({ content: 'You cannot pullroom yourself.', flags: MessageFlags.Ephemeral });
        
        // Get and check existing configuration and pullroom data
        const cData = interaction.client.cachedConfig;
        const pData = await PULL.findOne({ guildID: interaction.guild.id, userID: userOption.id });
        
        if (!cData?.pullroleid || !cData?.pullcategoryid || !cData?.pullmsg)
            return interaction.reply({ content: 'There is no data set up for pullrooms yet!', flags: MessageFlags.Ephemeral });
        if (pData)
            return interaction.reply({ content: `That user already has a pullroom session open in <#${pData.channelID}>.`, flags: MessageFlags.Ephemeral });
        
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        
        const [
            adminDiscussionChannel,
            pullCategory,
            pullMember
        ] = await Promise.all([
            getChannel(interaction.guild, SV.CHANNELS.ADMIN_DISCUSSION),
            getChannel(interaction.guild, cData.pullcategoryid), // Category dedicated to pullrooms
            getMember(interaction.guild, userOption.id)          // Member object for the person being pullroomed
        ]);

        if (pullCategory && pullMember) {
            // Modify username to fit Discord channel name limitations
            const modifiedUsername = channelText(userOption.username);
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

            await Promise.all([
                newPullData.save(), // Save pullroom data
                pullroomChannel.setPosition(0), // Set the channel to the top of the category
                pullMember.roles.add(cData.pullroleid), // Add the pulled role
                pullMember.voice.setChannel(null, { reason: 'Disconnected from voice channel as pullroomed' }) // Disconnect from any voice channels
            ]);

            await pullroomChannel?.send({ content: `The administration team would like to speak to you, <@${userOption.id}>.`, embeds: [pullEmbed] });

            // Ping the user in the pullroom channel, then delete it
            const pingMessage = await pullroomChannel?.send({ content: `<@${interaction.user.id}>` });
            await pingMessage.delete();

            // Send pullroom messages and followup to command
            await interaction.followUp({ content: `Pulled <@${userOption.id}> into <#${newPullData.channelID}>.` });
            await adminDiscussionChannel?.send({ content: `🪢 <@${userOption.id}> ${pullMember ? `(${pullMember.user.username}) ` : ''}was pullroomed by ${interaction.user.username}` });
        } else {
            return interaction.followUp({ content: 'The pullroom category no longer exists, or the member has left the server.' });
        }
    },
};