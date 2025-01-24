const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const CONFIG = require('../models/config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modmail-unhoist')
        .setDescription('Moves the current hoisted ModMail ticket down to ModMail Tickets')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    async execute(interaction) {
        const data = await CONFIG.findOne({ guildID: interaction.guild.id });  // Get existing configuration data

        if (!data) return interaction.reply({ content: 'I can\'t run that command if there is no data set up for the server! Use `/config-setup` first.' });
        if ((!data.mmcategoryid) || (!data.ammcategoryid)) return interaction.reply({ content: 'I can\'t run that command if there is no data set up for ModMail tickets! Use `/config-edit` first.' });
        if (interaction.channel.parent.id !== data.ammcategoryid) return interaction.reply({ content: `That command does not work here.`, ephemeral: true });

        // Change the ticket's parent to standard if the current category is for hoisted ModMail
        await interaction.channel.setParent(data.mmcategoryid);
        await interaction.reply({ content: `Moved the ticket up to the <#${data.mmcategoryid}> category.` });
    },
};