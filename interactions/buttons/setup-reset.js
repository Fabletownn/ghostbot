const { createDefaultConfig, createDefaultLogConfig, cacheConfigData, cacheLogConfigData } = require('../../utils/data-utils.js');
const CONFIG = require('../../models/config.js');
const LOG_CONFIG = require('../../models/logconfig.js');

module.exports = {
    customId: 'setup-reset',
    
    async execute(interaction) {
        await CONFIG.findOneAndDelete({ guildID: interaction.guild.id });     // Delete configuration data
        await LOG_CONFIG.findOneAndDelete({ guildID: interaction.guild.id }); // Delete log configuration data

        // Create new configuration data
        const newConfigData = createDefaultConfig(interaction.guild.id);
        const newLogData = createDefaultLogConfig(interaction.guild.id);

        // Save data and confirm followup
        await Promise.all([ newConfigData.save(), newLogData.save() ]);
        // Cache and update the newly updated data everywhere that it's used
        await cacheConfigData(interaction.client);
        await cacheLogConfigData(interaction.client);
        await interaction.update({ content: 'Data has been set back up for the server. Use the `/config` and `/log-config` commands to view and edit these values.', components: [] });
    }
}