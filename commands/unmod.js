const CONFIG = require('../models/config.js');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modmail-unmod')
        .setDescription('Moves the current hoisted ModMail ticket down to ModMail Tickets')
        .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),
    async execute(interaction) {
        CONFIG.findOne({
            guildID: interaction.guild.id
        }, async (err, data) => {
            if (err) return interaction.reply({ content: `Failed to move the ticket up!\n\`${err}\`` });
            if (!data) return interaction.reply({ content: 'I can\'t run that command if there is no data set up for the server! Use `/config-setup` first.' });
            if (!data.mmcategoryid || !data.ammcategoryid) return interaction.reply({ content: 'I can\'t run that command if there is no data set up for ModMail tickets! Use `/config-edit` first.' });

            if (interaction.channel.parent.id === data.ammcategoryid) {
                await interaction.channel.setParent(data.mmcategoryid);
                await interaction.reply({ content: `Moved the ticket down to the <#${data.mmcategoryid}> category.` });
            } else {
                return interaction.reply({ content: `That command does not work here.`, ephemeral: true });
            }
        });
    },
};