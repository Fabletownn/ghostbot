const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const CONFIG = require('../models/config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modmail-hoist')
        .setDescription('Moves the current ModMail thread up to Hoisted ModMail Tickets')
        .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),
    async execute(interaction) {
        const data = await CONFIG.findOne({ guildID: interaction.guild.id });  // Get existing configuration data

        if (!data) return interaction.reply({ content: 'I can\'t run that command if there is no data set up for the server! Use `/config-setup` first.' });
        if ((!data.mmcategoryid) || (!data.ammcategoryid)) return interaction.reply({ content: 'I can\'t run that command if there is no data set up for ModMail tickets! Use `/config-edit` first.' });
        if (interaction.channel.parent.id !== data.mmcategoryid) return interaction.reply({ content: `That command does not work here.`, ephemeral: true });

        // Change the ticket's parent to hoisted if the current category is for standard ModMail
        await interaction.channel.setParent(data.ammcategoryid);
        await interaction.reply({ content: `Moved the ticket up to the <#${data.ammcategoryid}> category.` });
    },
};