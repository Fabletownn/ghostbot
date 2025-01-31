const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const CONFIG = require('../models/config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config-view')
        .setDescription('(Admin) Views current server configuration')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const data = await CONFIG.findOne({ guildID: interaction.guild.id }); // Get existing configuration data

        if (!data) return interaction.reply({ content: 'There is no data set up for the server. Use the `/config-setup` command first!' });

        // Trigger configuration variables
        const configAutoPublish = (data.autopublish === true) ? 'Enabled' : (data.autopublish === false) ? 'Disabled' : 'Unset';
        const configThreadCreate = (data.threadcreate === true) ? 'Enabled' : (data.threadcreate === false) ? 'Disabled' : 'Unset';
        const configTagApply = (data.tagapply === true) ? 'Enabled' : (data.tagapply === false) ? 'Disabled' : 'Unset';

        // Channel configuration variables
        const configPBVCID = (data.pbvcid !== '') ? `<#${data.pbvcid}>` : 'Unset';
        const configPullCategory = (data.pullcategoryid !== '') ? `<#${data.pullcategoryid}>` : 'Unset';
        const configPullLogs = (data.pulllogid !== '') ? `<#${data.pulllogid}>` : 'Unset';

        // Miscellaneous - other configuration variables
        const configPBLimit = (data.pbvclimit !== '') ? data.pbvclimit.toString() : 'Unset';
        const configPullRole = (data.pullroleid !== '') ? `<@&${data.pullroleid}>` : 'Unset';
        const configPullMsg = (data.pullmsg !== '') ? data.pullmsg : 'Unset';

        const toggleEmbed = new EmbedBuilder()
            .setAuthor({ name: 'Trigger Configuration', iconURL: interaction.guild.iconURL({ dynamic: true, size: 512 }) })
            .addFields([
                { name: 'Autopublishing', value: configAutoPublish, inline: true },
                { name: 'Thread Creation', value: configThreadCreate, inline: true },
                { name: 'Tag Application', value: configTagApply, inline: true },
            ]);

        const channelEmbed = new EmbedBuilder()
            .setAuthor({ name: 'Channel Configuration', iconURL: interaction.guild.iconURL({ dynamic: true, size: 512 }) })
            .addFields([
                { name: 'Custom VC Creation', value: configPBVCID, inline: true },
                { name: 'Pullroom Category', value: configPullCategory, inline: true },
                { name: 'Pullroom Logs', value: configPullLogs, inline: true },
            ]);

        const otherEmbed = new EmbedBuilder()
            .setAuthor({ name: 'Miscellaneous Configuration', iconURL: interaction.guild.iconURL({ dynamic: true, size: 512 }) })
            .addFields([
                { name: 'Pullroom Role', value: configPullRole, inline: true },
                { name: 'Pullroom Message', value: configPullMsg, inline: true },
                { name: 'Custom VC User Limit', value: configPBLimit, inline: true }
            ]);

        await interaction.reply({ embeds: [toggleEmbed, channelEmbed, otherEmbed] });
    },
};