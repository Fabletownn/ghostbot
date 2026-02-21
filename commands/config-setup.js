const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');
const { createDefaultConfig, createDefaultLogConfig } = require('../utils/data-utils.js');
const CONFIG = require('../models/config.js');
const LOG_CONFIG = require('../models/logconfig.js');
const {cacheConfigData, cacheLogConfigData} = require("../utils/data-utils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config-setup')
        .setDescription('(Admin) Creates or resets data for the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const cData = await CONFIG.findOne({ guildID: interaction.guild.id });  // Get existing configuration data
        const lData = await LOG_CONFIG.findOne({ guildID: interaction.guild.id }); // Get existing log configuration data

        await interaction.deferReply(); // Defer the reply as this can take some time, and will error out otherwise

        // If there is no data for both configuration and log configuration, create new ones entirely
        if (!cData && !lData) {
            const newConfigData = createDefaultConfig(interaction.guild.id);
            const newLogData = createDefaultLogConfig(interaction.guild.id);

            await Promise.all([ newConfigData.save(), newLogData.save() ]);
            await interaction.followUp({ content: 'Data has been set up for the server. Use the `/config` and `/log-config` commands to view and edit configuration values.' });

            // Cache and update the newly updated data everywhere that it's used
            await cacheConfigData(interaction.client);
            await cacheLogConfigData(interaction.client);
            
        // If there is existing data for either configuration or log configuration data, send a reset prompt to confirm    
        } else if (cData || lData) {
            const setupRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('setup-reset')
                        .setEmoji('✅')
                        .setLabel('Reset')
                        .setStyle(ButtonStyle.Success),
                )
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('setup-cancel')
                        .setEmoji('⛔')
                        .setLabel('Cancel')
                        .setStyle(ButtonStyle.Danger),
                );

            await interaction.editReply({ content: 'There is already data set up for the server. Reset to default settings (**this will reset command and log configuration**)?', components: [setupRow] });
        }
    },
};