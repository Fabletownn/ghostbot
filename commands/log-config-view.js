const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const LCONFIG = require('../models/logconfig.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('log-config-view')
        .setDescription('(Admin) Views logging configuration')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        LCONFIG.findOne({
            guildID: interaction.guild.id
        }, async (err, data) => {
            if (err) return console.log(err);
            if (!data) return interaction.reply({ content: 'There is no data set up for the server. Use `/config-setup` first!' });

            const configDeleteChannel = (data.deletechannel !== '') ? `<#${data.deletechannel}> (${data.deletechannel})` : 'Unset';
            const configEditChannel = (data.editchannel !== '') ? `<#${data.editchannel}> (${data.editchannel})` : 'Unset';
            const configUsernameChannel = (data.usernamechannel !== '') ? `<#${data.usernamechannel}> (${data.usernamechannel})` : 'Unset';
            const configVCChannel = (data.vcchannel !== '') ? `<#${data.vcchannel}> (${data.vcchannel})` : 'Unset';
            const configUpdateChannel = (data.chanupchannel !== '') ? `<#${data.chanupchannel}> (${data.chanupchannel})` : 'Unset';
            const configIgnoredCategories = (data.ignoredcategories.length !== 0) ? `${data.ignoredcategories.map((c) => `<#${c}>`).join('\n')}` : 'None';
            const configIgnoredChannels = (data.ignoredchannels.length !== 0) ? `${data.ignoredchannels.map((c) => `<#${c}>`).join('\n')}` : 'None';

            const viewEmbed = new EmbedBuilder()
                .setAuthor({ name: 'Log Configuration', iconURL: interaction.guild.iconURL({ dynamic: true, size: 512 }) })
                .addFields([
                    { name: 'Deleted', value: configDeleteChannel, inline: true },
                    { name: 'Username Updates', value: configUsernameChannel, inline: true },
                    { name: '\u200b', value: '\u200b', inline: true },
                    { name: 'Edited', value: configEditChannel, inline: true },
                    { name: 'VC Updates', value: configVCChannel, inline: true },
                    { name: '\u200b', value: '\u200b', inline: true },
                    { name: 'Ignored Categories', value: configIgnoredCategories, inline: true },
                    { name: 'Channel Updates', value: configUpdateChannel, inline: true },
                    { name: '\u200b', value: '\u200b', inline: true },
                    { name: 'Ignored Channels', value: configIgnoredChannels, inline: false },
                ])
                .setColor('#3838FC');

            await interaction.reply({ embeds: [viewEmbed] });
        });
    },
};