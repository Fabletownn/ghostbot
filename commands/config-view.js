const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config-view')
        .setDescription('(Admin) Views current server configuration')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const cData = interaction.client.cachedConfig; // Get existing configuration data
        if (!cData) return interaction.reply({ content: 'There is no data set up for the server. Use the `/config-setup` command first!' });

        // Trigger configuration variables
        const configAutoPublish = cData.autopublish ? 'Enabled' : (!cData.autopublish ? 'Disabled' : 'Unset');
        const configThreadCreate = cData.threadcreate ? 'Enabled' : (!cData.threadcreate ? 'Disabled' : 'Unset');

        // Channel configuration variables
        const configPBVCID = cData.pbvcid ? `<#${cData.pbvcid}>` : 'Unset';
        const configPullCategory = cData.pullcategoryid ? `<#${cData.pullcategoryid}>` : 'Unset';
        const configPullLogs = cData.pulllogid ? `<#${cData.pulllogid}>` : 'Unset';

        // Miscellaneous - other configuration variables
        const configPBLimit = cData.pbvclimit.toString() ? cData.pbvclimit.toString() : 'Unset';
        const configPullRole = cData.pullroleid ? `<@&${cData.pullroleid}>` : 'Unset';
        const configPullMsg = cData.pullmsg ? cData.pullmsg : 'Unset';

        const toggleEmbed = new EmbedBuilder()
            .setAuthor({ name: 'Trigger Configuration', iconURL: interaction.guild.iconURL({ dynamic: true, size: 512 }) })
            .addFields([
                { name: 'Autopublishing', value: configAutoPublish, inline: true },
                { name: 'Thread Creation', value: configThreadCreate, inline: true }
            ]);

        const channelEmbed = new EmbedBuilder()
            .setAuthor({ name: 'Channel Configuration', iconURL: interaction.guild.iconURL({ dynamic: true, size: 512 }) })
            .addFields([
                { name: 'Custom VC Creation', value: configPBVCID, inline: true },
                { name: 'Pullroom Category', value: configPullCategory, inline: true },
                { name: 'Pullroom Logs', value: configPullLogs, inline: true }
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