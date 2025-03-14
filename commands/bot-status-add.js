const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const STATUS = require('../models/statuses.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bot-status-add')
        .setDescription('Add a status for the bot to use')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addStringOption((option) =>
            option.setName('status')
                .setDescription('The status that the bot would have when chosen')
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(128)
        ),
    async execute(interaction) {
        const statusOption = interaction.options.getString('status');                // Get the inputted status
        const data = await STATUS.findOne({ guildID: interaction.guild.id }); // Get the existing status data
        
        // Create a new set of data entirely if not already existing (should only occur first-time)
        if (!data) {
            const newStatusData = new STATUS({
                guildID: interaction.guild.id,
                statuses: ['Playing Phasmophobia', statusOption]
            });

            await newStatusData.save();
            await interaction.reply({ content: `Added status \`${statusOption}\` successfully at **index ${newStatusData.statuses.indexOf(statusOption) || '?'}**.` });
            
        // Push the new status into the array of data, and save it    
        } else if (data) {
            data.statuses.push(statusOption);
            await data.save();
            await interaction.reply({ content: `Added status \`${statusOption}\` successfully at **index ${data.statuses.indexOf(statusOption) || '?'}**.` });
        }
    },
};