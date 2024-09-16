const { SlashCommandBuilder } = require('discord.js');
const PARTY = require('../models/party.js');
const CONFIG = require('../models/config.js');

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

        CONFIG.findOne({
            guildID: interaction.guild.id
        }, async (cErr, cData) => {
            if (cErr) return interaction.reply({ content: 'An unknown issue occurred. If this keeps happening, please message ModMail.', ephemeral: true });
            if (!cData) return interaction.reply({ content: 'These commands are not yet available for use. Please check back later!', ephemeral: true });

            PARTY.findOne({
                voiceID: voiceChannelID
            }, async (pErr, pData) => {
                if (pErr) return interaction.reply({ content: 'An unknown issue occurred. If this keeps happening, please message ModMail.', ephemeral: true });
                if (!pData) return interaction.reply({ content: 'You are not connected to any custom voice channels.', ephemeral: true });
                if (interaction.user.id !== pData.ownerID) return interaction.reply({ content: `You are not the current host of this custom voice channel. Ask <@${pData.ownerID}> to run these commands!`, ephemeral: true });

                switch (actionOption) {
                    case "lockroom":
                        await voiceChannel.setUserLimit(voiceChannel.members.size);
                        await interaction.reply({ content: 'Your voice channel has been locked.', ephemeral: true });
                        break;
                    case "unlockroom":
                        await voiceChannel.setUserLimit(cData.pbvclimit);
                        await interaction.reply({ content: 'Your voice channel has been unlocked.', ephemeral: true });
                        break;
                    case "kickuser": {
                        if (!userOption) return interaction.reply({ content: 'This action requires a `user` option to be filled out.', ephemeral: true });

                        const kickVoiceChannel = interaction.guild.members.cache.get(userOption.id).voice.channel;

                        if (userOption.id === interaction.user.id || userOption.bot || interaction.guild.members.cache.get(userOption.id).roles.cache.has(moderatorRoleID)) return interaction.reply({ content: 'You cannot kick that user.', ephemeral: true });
                        if (kickVoiceChannel === null || kickVoiceChannel.id !== voiceChannelID) return interaction.reply({ content: 'That user is not connected to your voice channel.', ephemeral: true });
                        if (!interaction.guild.members.cache.get(userOption.id)) return interaction.reply({ content: 'That user is no longer in the server.', ephemeral: true });

                        await interaction.guild.members.cache.get(userOption.id).voice.setChannel(null, {
                            reason: `Disconnected from voice channel by custom VC host ${interaction.user.username} (${interaction.user.displayName})`
                        });

                        await interaction.reply({ content: `Kicked <@${userOption.id}> from your voice channel.`, ephemeral: true });
                        break;
                    }
                    case "banuser": {
                        if (!userOption) return interaction.reply({ content: 'This action requires a `user` option to be filled out.', ephemeral: true });

                        const userVoiceChannel = interaction.guild.members.cache.get(interaction.user.id).voice?.channel;

                        if (userOption.id === interaction.user.id || userOption.bot || interaction.guild.members.cache.get(userOption.id).roles.cache.has(moderatorRoleID)) return interaction.reply({ content: 'You cannot ban that user.', ephemeral: true });
                        if (!interaction.guild.members.cache.get(userOption.id)) return interaction.reply({ content: 'That user is no longer in the server.', ephemeral: true });

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
                        break;
                    }
                    case "unbanuser": {
                        const unbanVoiceChannel = interaction.guild.members.cache.get(interaction.user.id).voice.channel;

                        if (!userOption) return interaction.reply({ content: 'This action requires a `user` option to be filled out.', ephemeral: true });
                        if (!interaction.guild.members.cache.get(userOption.id)) return interaction.reply({ content: 'That user is no longer in the server.', ephemeral: true });

                        await unbanVoiceChannel.permissionOverwrites.delete(userOption.id);
                        await interaction.reply({ content: `Unbanned <@${userOption.id}> from your voice channel.`, ephemeral: true });
                        break;
                    }
                    case "transferowner": {
                        if (!userOption) return interaction.reply({ content: 'This action requires a `user` option to be filled out.', ephemeral: true });

                        const ownerVoiceChannel = interaction.guild.members.cache.get(userOption.id).voice.channel;

                        if (!ownerVoiceChannel) return interaction.reply({ content: 'That user is not connected to your voice channel.', ephemeral: true });
                        if (ownerVoiceChannel.id !== voiceChannelID) return interaction.reply({ content: 'That user is not connected to your voice channel.', ephemeral: true });
                        if (!interaction.guild.members.cache.get(userOption.id)) return interaction.reply({ content: 'That user is no longer in the server.', ephemeral: true });

                        pData.ownerID = userOption.id;
                        pData.save().catch((err) => console.log(err)).then(() => interaction.reply({ content: `Transferred voice channel ownership to <@${userOption.id}>.`, ephemeral: true }));
                        break;
                    }
                    default:
                        break;
                }
            });
        });
    },
};