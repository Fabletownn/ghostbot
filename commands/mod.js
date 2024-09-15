const CONFIG = require('../models/config.js');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modmail-mod')
        .setDescription('(Staff) Moves the current ModMail thread up to Admin/Mod Tickets')
        .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),
    async execute(interaction) {
        CONFIG.findOne({
            guildID: interaction.guild.id
        }, async (err, data) => {
            if (err) return interaction.reply({ content: `Failed to move the ticket up!\n\`${err}\`` });
            if (!data) return interaction.reply({ content: 'I can\'t run that command if there is no data set up for the server! Use `/config-setup` first.' });
            if (!data.mmcategoryid || !data.ammcategoryid) return interaction.reply({ content: 'I can\'t run that command if there is no data set up for ModMail tickets! Use `/config-edit` first.' });

            if (interaction.channel.parent.id == data.mmcategoryid) {
                await interaction.channel.setParent(data.ammcategoryid);
                await interaction.reply({ content: `Moved the ticket up to the <#${data.ammcategoryid}> category.` });
            } else {
                return interaction.reply({ content: `That command does not work here.`, ephemeral: true });
            }
        });
    },
};