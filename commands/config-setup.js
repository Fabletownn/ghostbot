const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');
const CONFIG = require('../models/config.js');
const LCONFIG = require('../models/logconfig.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config-setup')
        .setDescription('(Admin) Creates or resets data for the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const cData = await CONFIG.findOne({ guildID: interaction.guild.id });  // Get existing configuration data
        const lData = await LCONFIG.findOne({ guildID: interaction.guild.id }); // Get existing log configuration data

        await interaction.deferReply(); // Defer the reply as this can take some time, and will error out otherwise

        // If there is no data for both configuration and log configuration, create new ones entirely
        if (!cData && !lData) {
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
                pullmsg: '',
                mmcategoryid: '',
                ammcategoryid: ''
            });

            const newLogData = new LCONFIG({
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

            await newLogData.save().catch((err) => console.log(err));
            await newConfigData.save().catch((err) => console.log(err));

            await interaction.editReply({ content: 'Data has been set up for the server. Use the `/config` and `/log-config` commands to view and edit these values.' });
            
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

            await interaction.editReply({ content: 'There is already data set for the server. Reset to default settings (**this will reset command and log configuration**)?', components: [setupRow] });
        }
    },
};