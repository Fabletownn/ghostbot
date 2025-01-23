const { SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const PARTY = require('../models/party.js');
const CONFIG = require('../models/config.js');
const LCONFIG = require("../models/logconfig.js");

const actionArray = ([
    { name: 'Transfer Room Ownership (User)', value: 'transferowner' },
    { name: 'Kick User (User)', value: 'kickuser' },
    { name: 'Ban User (User)', value: 'banuser' },
    { name: 'Unban User (User)', value: 'unbanuser' },
    { name: 'Lock Room', value: 'lockroom' },
    { name: 'Unlock Room', value: 'unlockroom' }
]);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vc')
        .setDescription('(User) Manage your custom-made voice channel')
        .addStringOption((option) =>
            option.setName('action')
                .setDescription('(If you are host) The action done to your voice channel')
                .addChoices(...actionArray)
                .setRequired(true)
        )
        .addUserOption((option) =>
            option.setName('user')
                .setDescription('(If action requires user) The user that will be affected')
                .setRequired(false)
        ),
    async execute(interaction) {
        const actionOption = interaction.options.getString('action');
        const userOption = interaction.options.getUser('user');

        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) return interaction.reply({ content: 'You are not connected to any custom voice channels.', ephemeral: true });

        const voiceChannelID = voiceChannel.id;
        const moderatorRoleID = '756591038373691606';

        const cData = await CONFIG.findOne({
            guildID: interaction.guild.id
        });

        const pData = await PARTY.findOne({
            voiceID: voiceChannelID
        });

        if (!cData) return interaction.reply({ content: 'These commands are not yet available for use. Please check back later!', ephemeral: true });
        if (!pData) return interaction.reply({ content: 'You are not connected to any custom voice channels.', ephemeral: true });

        if (interaction.user.id !== pData.ownerID) return interaction.reply({ content: `You are not the current host of this custom voice channel. Ask <@${pData.ownerID}> to run these commands!`, ephemeral: true });

        let userID = 0;

        switch (actionOption) {
            case "lockroom":
                if (!(await checkOwnership(interaction))) return interaction.reply({ content: 'You no longer own this room.', ephemeral: true });

                await voiceChannel.setUserLimit(voiceChannel.members.size);
                await interaction.reply({ content: 'Your voice channel has been locked.', ephemeral: true });
                break;
            case "unlockroom":
                if (!(await checkOwnership(interaction))) return interaction.reply({ content: 'You no longer own this room.', ephemeral: true });

                await voiceChannel.setUserLimit(cData.pbvclimit);
                await interaction.reply({ content: 'Your voice channel has been unlocked.', ephemeral: true });
                break;
            case "kickuser":
                if (!userOption) return interaction.reply({ content: 'This action requires a `user` option to be filled out.', ephemeral: true });

                const kickVoiceChannel = interaction.guild.members.cache.get(userOption.id).voice.channel;

                if (userOption.id === interaction.user.id || userOption.bot || interaction.guild.members.cache.get(userOption.id).roles.cache.has(moderatorRoleID)) return interaction.reply({ content: 'You cannot kick that user.', ephemeral: true });
                if (kickVoiceChannel === null || kickVoiceChannel.id !== voiceChannelID) return interaction.reply({ content: 'That user is not connected to your voice channel.', ephemeral: true });
                if (!interaction.guild.members.cache.get(userOption.id)) return interaction.reply({ content: 'That user is no longer in the server.', ephemeral: true });

                if (!(await checkOwnership(interaction))) return interaction.reply({ content: 'You no longer own this room.', ephemeral: true });
                await interaction.guild.members.cache.get(userOption.id).voice.setChannel(null, {
                    reason: `Disconnected from voice channel by custom VC host ${interaction.user.username} (${interaction.user.displayName})`
                });

                await interaction.reply({ content: `Kicked <@${userOption.id}> from your voice channel.`, ephemeral: true });

                userID = userOption.id;
                break;
            case "banuser":
                if (!userOption) return interaction.reply({ content: 'This action requires a `user` option to be filled out.', ephemeral: true });

                const userVoiceChannel = interaction.guild.members.cache.get(interaction.user.id).voice?.channel;

                if (userOption.id === interaction.user.id || userOption.bot || interaction.guild.members.cache.get(userOption.id).roles.cache.has(moderatorRoleID)) return interaction.reply({ content: 'You cannot ban that user.', ephemeral: true });
                if (!interaction.guild.members.cache.get(userOption.id)) return interaction.reply({ content: 'That user is no longer in the server.', ephemeral: true });

                if (!(await checkOwnership(interaction))) return interaction.reply({ content: 'You no longer own this room.', ephemeral: true });
                await userVoiceChannel.permissionOverwrites.edit(userOption.id, {
                    Connect: false
                }).then(async () => {
                    const banVoiceChannel = interaction.guild.members.cache.get(userOption.id).voice?.channel;

                    if (banVoiceChannel?.id === userVoiceChannel?.id) {
                        await interaction.guild.members.cache.get(userOption.id).voice.setChannel(null, {
                            reason: `Banned from voice channel by custom VC host ${interaction.user.username} (${interaction.user.displayName})`
                        });
                    }

                    await interaction.reply({ content: `Banned <@${userOption.id}> from your voice channel.`, ephemeral: true });
                });

                userID = userOption.id;
                break;
            case "unbanuser":
                const unbanVoiceChannel = interaction.guild.members.cache.get(interaction.user.id).voice.channel;

                if (!userOption) return interaction.reply({ content: 'This action requires a `user` option to be filled out.', ephemeral: true });
                if (!interaction.guild.members.cache.get(userOption.id)) return interaction.reply({ content: 'That user is no longer in the server.', ephemeral: true });

                if (!(await checkOwnership(interaction))) return interaction.reply({ content: 'You no longer own this room.', ephemeral: true });
                await unbanVoiceChannel.permissionOverwrites.delete(userOption.id);
                await interaction.reply({ content: `Unbanned <@${userOption.id}> from your voice channel.`, ephemeral: true });

                userID = userOption.id;
                break;
            case "transferowner":
                if (!userOption) return interaction.reply({ content: 'This action requires a `user` option to be filled out.', ephemeral: true });

                const ownerVoiceChannel = interaction.guild.members.cache.get(userOption.id).voice.channel;

                if (!ownerVoiceChannel) return interaction.reply({ content: 'That user is not connected to your voice channel.', ephemeral: true });
                if (ownerVoiceChannel.id !== voiceChannelID) return interaction.reply({ content: 'That user is not connected to your voice channel.', ephemeral: true });
                if (!interaction.guild.members.cache.get(userOption.id)) return interaction.reply({ content: 'That user is no longer in the server.', ephemeral: true });

                pData.ownerID = userOption.id;

                if (!(await checkOwnership(interaction))) return interaction.reply({ content: 'You no longer own this room!', ephemeral: true });
                pData.save().catch((err) => console.log(err)).then(() => interaction.reply({ content: `Transferred voice channel ownership to <@${userOption.id}>.`, ephemeral: true }));

                userID = userOption.id;
                break;
            default:
                break;
        }

        await log_action(interaction, actionOption, userID);
    },
};

async function log_action(interaction, choicekey, userID = 0) {
    const data = await LCONFIG.findOne({
        guildID: interaction.guild.id
    });

    if (!data) return;
    if (!data.vcchannel) return;

    const logUser = interaction.user;
    const logAvatar = interaction.user.displayAvatarURL({ dynamic: true });
    const cTimestamp = Math.round((Date.now()) / 1000);

    let logMessage = 'Unknown';

    switch (choicekey) {
        case "lockroom":
            logMessage = 'Locked their room';
            break;
        case "unlockroom":
            logMessage = 'Unlocked their room';
            break;
        case "kickuser":
            logMessage = 'Kicked a member from their room';
            break;
        case "banuser":
            logMessage = 'Banned a member from their room';
            break;
        case "unbanuser":
            logMessage = 'Unbanned a member from their room';
            break;
        case "transferowner":
            logMessage = 'Transferred ownership to another member';
            break;
        default:
            return;
    }

    const logEmbed = new EmbedBuilder()
        .setAuthor({ name: logUser.username, iconURL: logAvatar })
        .setDescription(`<@${logUser.id}> updated their custom voice channel`)
        .addFields([
            { name: 'Action', value: logMessage, inline: true }
        ])
        .setTimestamp();

    if (userID !== 0) { // If there was a user ID that got kicked/banned/etc. log it
        await logEmbed.addFields([
            { name: 'Member', value: `<@${userID}> (${userID})`, inline: true },
            { name: 'Date', value: `<t:${cTimestamp}:F>`, inline: false },
            { name: 'ID', value: `\`\`\`ini\nOwner = ${logUser.id}\nUser = ${userID}\`\`\`` }
        ]);
    } else {
        await logEmbed.addFields([
            { name: 'Date', value: `<t:${cTimestamp}:F>`, inline: false },
            { name: 'ID', value: `\`\`\`ini\nOwner = ${logUser.id}\`\`\`` }
        ]);
    }

    await interaction.guild.channels.cache.get(data.vcchannel).send({ embeds: [logEmbed] });
}

async function checkOwnership(interaction) {
    const currentChannel = interaction?.member?.voice?.channel;
    const userID = interaction?.user?.id;

    if (currentChannel && userID) {
        const checkData = await PARTY.findOne({
            voiceID: currentChannel.id,
            ownerID: userID
        });

        if (checkData) return true;
    }

    return false;
}