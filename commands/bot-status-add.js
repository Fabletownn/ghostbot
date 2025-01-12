const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const STATUS = require('../models/statuses.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bot-status-add')
        .setDescription('Add a status for the bot to use')
        .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers)
        .addStringOption((option) =>
            option.setName('status')
                .setDescription('The status that the bot would have when chosen')
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(128)
        ),
    async execute(interaction) {
        const statusOption = interaction.options.getString('status');

        const data = await STATUS.findOne({
            guildID: interaction.guild.id
        });
        
        if (!data) {
            const newStatusData = new STATUS({
                guildID: interaction.guild.id,
                statuses: ['Playing Phasmophobia', statusOption]
            });

            newStatusData.save().catch((err) => console.log(err)).then(() => interaction.reply({ content: `Added status \`${statusOption}\` successfully at **index ${newStatusData.statuses.indexOf(statusOption) || '?'}**.` }));
        } else if (data) {
            data.statuses.push(statusOption);
            data.save().catch((err) => console.log(err)).then(() => interaction.reply({ content: `Added status \`${statusOption}\` successfully at **index ${data.statuses.indexOf(statusOption) || '?'}**.` }));
        }
    },
};