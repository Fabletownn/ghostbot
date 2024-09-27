const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const STATUS = require('../models/statuses.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bot-status-remove')
        .setDescription('(Staff) Removes a status from the bot to use')
        .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers)
        .addIntegerOption((option) =>
            option.setName('index')
                .setDescription('The index of the status that was mentioned upon addition')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(999)
        ),
    async execute(interaction) {
        const indexOption = parseInt(interaction.options.getInteger('index'));

        const data = await STATUS.findOne({
            guildID: interaction.guild.id
        });
        
        if (!data) return interaction.reply({ content: 'I can\'t run that command when there is no status data yet! Use `/bot-status-add` first.' });

        const indexContent = data.statuses.at(indexOption);

        if (data.statuses[indexOption]) {
            data.statuses[indexOption] = null;
            data.save().catch((err) => console.log(err)).then(() => interaction.reply({ content: `Removed status \`${indexContent || '?'}\` successfully (previously in **index ${indexOption}**).` }));
        } else {
            return interaction.reply({ content: 'There is no status with that index number!' });
        }
    },
};