const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const STATUS = require('../models/statuses.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bot-status-remove')
        .setDescription('Removes a status from the bot to use')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addIntegerOption((option) =>
            option.setName('index')
                .setDescription('The index of the status that was mentioned upon addition')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(999)
        ),
    async execute(interaction) {
        const sData = await STATUS.findOne({ guildID: interaction.guild.id }); // Get existing status data
        if (!sData) return interaction.reply({ content: 'I can\'t run that command when there is no status data yet! Use `/bot-status-add` first.' });

        const indexOption = interaction.options.getInteger('index'); // Get index integer
        const indexContent = sData.statuses.at(indexOption);    // If there is data, get the status fetched

        // Find and set the status at the given index to null, which is filtered out in future iterations
        if (sData.statuses[indexOption]) {
            sData.statuses[indexOption] = null;
            await sData.save();
            await interaction.reply({ content: `Removed status \`${indexContent || '?'}\` successfully (previously in **index ${indexOption}**).` });
        } else {
            return interaction.reply({ content: 'There is no status with that index number!' });
        }
    },
};