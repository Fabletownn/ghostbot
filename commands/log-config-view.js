const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('log-config-view')
        .setDescription('(Admin) Views logging configuration')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const lData = interaction.client.cachedLogConfig; // Get existing log configuration data
        if (!lData) return interaction.reply({ content: 'There is no data set up for the server. Use `/config-setup` first!' });

        // Channel configuration values
        const configDeleteChannel = lData.deletechannel ? `<#${lData.deletechannel}> (${lData.deletechannel})` : 'Unset';
        const configEditChannel = lData.editchannel ? `<#${lData.editchannel}> (${lData.editchannel})` : 'Unset';
        const configUsernameChannel = lData.usernamechannel ? `<#${lData.usernamechannel}> (${lData.usernamechannel})` : 'Unset';
        const configVCChannel = lData.vcchannel ? `<#${lData.vcchannel}> (${lData.vcchannel})` : 'Unset';
        const configUpdateChannel = lData.chanupchannel ? `<#${lData.chanupchannel}> (${lData.chanupchannel})` : 'Unset';
        
        // Ignored configuration values
        const configIgnoredCategories = (lData.ignoredcategories.length !== 0) ? `${lData.ignoredcategories.map((c) => `<#${c}>`).join('\n')}` : 'None';
        const configIgnoredChannels = (lData.ignoredchannels.length !== 0) ? `${lData.ignoredchannels.map((c) => `<#${c}>`).join('\n')}` : 'None';

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
    },
};