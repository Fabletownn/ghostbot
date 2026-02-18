const { EmbedBuilder, MessageFlags } = require('discord.js');
const LOG_CONFIG = require('../../models/logconfig.js');
const fetch = require("../../utils/fetch-utils");

module.exports = {
    customId: 'say-modal',

    async execute(interaction) {
        try {
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
            await fetch.getChannel(interaction.guild, lData.chanupchannel).send({ embeds: [sayEmbed] });
            await interaction.reply({ content: 'Your message has been ghostified.', flags: MessageFlags.Ephemeral });
        } catch (error) {
            trailError(error);

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'An error occurred trying to mimic that message.', flags: MessageFlags.Ephemeral });
            }
        }
    }
}