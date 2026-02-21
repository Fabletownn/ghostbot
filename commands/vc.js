const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getMember } = require('../utils/fetch-utils.js');
const { handleAction, logAction, checkOwnership } = require('../utils/vc-utils.js');
const PARTY = require('../models/party.js');
const SV = require('../models/server-values.json');

// List of manage options that will appear in the command list
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
        const actionOption = interaction.options.getString('action'); // Voice channel action selected
        const userOption = interaction.options.getUser('user');       // User given if action needs it

        const voiceChannel = interaction.member.voice.channel; // Voice channel the user is in
        if (!voiceChannel) return interaction.reply({ content: 'You are not connected to any custom voice channels.', flags: MessageFlags.Ephemeral });

        const voiceChannelID = voiceChannel.id; // ID of the voice channel the user is currently in
        const cData = interaction.client.cachedConfig; // Get existing configuration data
        const pData = await PARTY.findOne({ voiceID: voiceChannelID });        // Get existing voice channel data
        if (!cData) return interaction.reply({ content: 'These commands are not yet available for use. Please check back later!', flags: MessageFlags.Ephemeral });
        if (!pData) return interaction.reply({ content: 'You are not connected to any custom voice channels.', flags: MessageFlags.Ephemeral });

        const isRoomOwned = await checkOwnership(interaction);
        if (!isRoomOwned) return interaction.reply({ content: `You are not the current host of this custom voice channel. Ask <@${pData.ownerID}> to run these commands!`, flags: MessageFlags.Ephemeral });

        const actionName = actionArray.find((a) => a.value === actionOption);
        if (actionName.name.toString().toLowerCase().includes('user') && !userOption) return interaction.reply({ content: 'This action requires a `user` option to be filled out.', flags: MessageFlags.Ephemeral });
        
        const immuneRoles = [SV.ROLES.KINETIC_GAMES, SV.ROLES.TRIAL_MODERATOR, SV.ROLES.MODERATOR]; // Immune roles to be invulnerable from moderative actions
        if (userOption) {
            const member = await getMember(interaction.guild, userOption.id);

            if (userOption.id === interaction.user.id || userOption.bot) return interaction.reply({ content: 'You cannot action that user.', flags: MessageFlags.Ephemeral });
            if (member && (immuneRoles.some((role) => member.roles.cache.has(role)))) {
                if (actionOption !== 'transferowner') {
                    return interaction.reply({ content: 'You cannot action that user.', flags: MessageFlags.Ephemeral });
                }
            }
        }
        
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        
        const action = await handleAction(interaction, voiceChannel, actionOption, userOption);
        await logAction(interaction, actionOption, action);
        
        // If something errored during execution, don't respond with a success message
        if (interaction.replied) return;
        
        switch (actionOption) {
            case 'lockroom':
                await interaction.followUp({ content: 'Your voice channel has been locked.' });
                break;
            case 'unlockroom':
                await interaction.followUp({ content: 'Your voice channel has been unlocked.' });
                break;
            case 'kickuser':
                await interaction.followUp({ content: `Kicked <@${userOption.id}> from your voice channel.` });
                break;
            case 'banuser':
                await interaction.followUp({ content: `Banned <@${userOption.id}> from your voice channel.` });
                break;
            case 'unbanuser':
                await interaction.followUp({ content: `Unbanned <@${userOption.id}> from your voice channel.` });
                break;
            case 'transferowner':
                await interaction.followUp({ content: `Transferred voice channel ownership to <@${userOption.id}>.` });
                break;
        }
    },
};
