const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const STATUS = require('../models/statuses.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bot-status-add')
        .setDescription('(Staff) Add a status for the bot to use')
        .setDMPermission(false)
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

        STATUS.findOne({
            guildID: interaction.guild.id
        }, (err, data) => {
            if (err) return console.log(err);

            if (!data) {
                const newStatusData = new STATUS({
                    guildID: interaction.guild.id,
                    statuses: ['Phasmophobia', statusOption]
                });

                newStatusData.save().catch((err) => console.log(err)).then(() => interaction.reply({ content: `Added status \`${statusOption}\` successfully at **index ${newStatusData.statuses.indexOf(statusOption) || '?'}**.` }));
            } else if (data) {
                data.statuses.push(statusOption);
                data.save().catch((err) => console.log(err)).then(() => interaction.reply({ content: `Added status \`${statusOption}\` successfully at **index ${data.statuses.indexOf(statusOption) || '?'}**.` }));
            }
        });
    },
};