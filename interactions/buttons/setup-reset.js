const CONFIG = require('../../models/config.js');
const LOG_CONFIG = require('../../models/logconfig.js');

module.exports = {
    customId: 'setup-reset',
    
    async execute(interaction) {
        try {
            await CONFIG.findOneAndDelete({ guildID: interaction.guild.id });     // Delete configuration data
            await LOG_CONFIG.findOneAndDelete({ guildID: interaction.guild.id }); // Delete log configuration data

            // Create new configuration data
            const newConfigData = new CONFIG({
                guildID: interaction.guild.id,
                autopublish: false,
                threadcreate: false,
                tagapply: false,
                pbvcid: '',
                pbvclimit: 4,
                pullcategoryid: '',
                pullroleid: '',
                pulllogid: '',
                pullmsg: ''
            });

            // Create new log configuration data
            const newLogData = new LOG_CONFIG({
                guildID: interaction.guild.id,
                deletechannel: '',
                editchannel: '',
                ignoredchannels: [],
                ignoredcategories: [],
                deletewebhook: '',
                editwebhook: '',
                usernamewebhook: '',
                vcwebhook: '',
                chanupwebhook: '',
                usernamechannel: '',
                vcchannel: '',
                chanupchannel: ''
            });

            // Save data and confirm followup
            await Promise.all([ newConfigData.save(), newLogData.save() ]);
            await interaction.update({ content: 'Data has been set back up for the server. Use the `/config` and `/log-config` commands to view and edit these values.', components: [] });
        } catch (error) {
            trailError(error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'An error occurred trying to reset server data.', flags: MessageFlags.Ephemeral });
            }
        }
    }
}