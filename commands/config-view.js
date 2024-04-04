const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const CONFIG = require('../models/config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config-view')
        .setDescription('(Admin) Views current server configuration')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        CONFIG.findOne({
            guildID: interaction.guild.id
        }, async (err, data) => {
            if (err) return interaction.reply({ content: `Failed to view data for the server!\n\`${err}\`` });
            if (!data) return interaction.reply({ content: 'There is no data set up for the server. Use the `/config-setup` command first!' });

            const configAutoPublish = (data.autopublish === true) ? 'Enabled' : (data.autopublish === false) ? 'Disabled' : 'Unset';
            const configThreadCreate = (data.threadcreate === true) ? 'Enabled' : (data.threadcreate === false) ? 'Disabled' : 'Unset';
            const configTagApply = (data.tagapply === true) ? 'Enabled' : (data.tagapply === false) ? 'Disabled' : 'Unset';
            const configPBVCID = (data.pbvcid !== '') ? `<#${data.pbvcid}>` : 'Unset';
            const configPBLimit = (data.pbvclimit !== '') ? data.pbvclimit.toString() : 'Unset';
            const configPullCategory = (data.pullcategoryid !== '') ? `<#${data.pullcategoryid}>` : 'Unset';
            const configPullRole = (data.pullroleid !== '') ? `<@&${data.pullroleid}>` : 'Unset';
            const configPullLogs = (data.pulllogid !== '') ? `<#${data.pulllogid}>` : 'Unset';
            const configPullMsg = (data.pullmsg !== '') ? data.pullmsg : 'Unset';
            const configMMCategory = (data.mmcategoryid !== '') ? `<#${data.mmcategoryid}>` : 'Unset';
            const configAMMCategory = (data.ammcategoryid !== '') ? `<#${data.ammcategoryid}>` : 'Unset';

            const viewEmbed = new EmbedBuilder()
                .setAuthor({ name: 'Configuration', iconURL: interaction.guild.iconURL({ dynamic: true, size: 512 }) })
                .addFields([
                    { name: 'Autopublishing', value: configAutoPublish, inline: true },
                    { name: 'Thread Creation', value: configThreadCreate, inline: true },
                    { name: 'Tag Application', value: configTagApply, inline: true },
                    { name: 'Pullroom', value: configPullCategory, inline: true },
                    { name: 'ModMail Tickets', value: configMMCategory, inline: true },
                    { name: 'Hoisted Tickets', value: configAMMCategory, inline: true },
                    { name: 'Pullroom Logs', value: configPullLogs, inline: true },
                    { name: 'PartyBot Creation', value: configPBVCID, inline: true },
                    { name: '\u200b', value: '\u200b', inline: true },
                    { name: 'Pullroom Role', value: configPullRole, inline: true },
                    { name: 'Pullroom Message', value: configPullMsg, inline: true },
                    { name: 'PartyBot User Limit', value: configPBLimit, inline: true }
                ])
                .setColor('#3838FC');
            
            await interaction.reply({ embeds: [viewEmbed] });
        });
    },
};