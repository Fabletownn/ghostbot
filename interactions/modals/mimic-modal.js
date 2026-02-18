const { EmbedBuilder, MessageFlags } = require('discord.js');
const { getChannel } = require('../../utils/fetch-utils.js');
const LOG_CONFIG = require('../../models/logconfig.js');

module.exports = {
    customId: 'say-modal',

    async execute(interaction) {
        const lData = await LOG_CONFIG.findOne({ guildID: interaction.guild.id }); // Get existing log configuration data
        if (!lData) return interaction.reply({ content: 'Failed to mimic your message as there is no logging configuration data.', flags: MessageFlags.Ephemeral });

        const mimicMessage = interaction.fields.getTextInputValue('say-msg'); // Get message text value
        const sayEmbed = new EmbedBuilder()
            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 512 }) })
            .setDescription(`${interaction.user} ghostified a message in ${interaction.channel}`)
            .addFields([
                { name: 'Content', value: mimicMessage.slice(0, 1020) }
            ])
            .setTimestamp()

        // Send the message, log that it has been sent, and reply with confirmation
        await interaction.channel.send({ content: mimicMessage });
        await getChannel(interaction.guild, lData.chanupchannel).send({ embeds: [sayEmbed] });
        await interaction.reply({ content: 'Your message has been ghostified.', flags: MessageFlags.Ephemeral });
    }
}