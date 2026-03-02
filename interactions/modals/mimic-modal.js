const { EmbedBuilder, MessageFlags } = require('discord.js');
const { getChannel } = require('../../utils/fetch-utils.js');

module.exports = {
    customId: 'mimic-modal',

    async execute(interaction) {
        // Get and check existing log configuration data
        const lData = interaction.client.cachedLogConfig;
        if (!lData) return interaction.reply({ content: 'There is no logging configuration data yet.', flags: MessageFlags.Ephemeral });

        const mimicMessage = interaction.fields.getTextInputValue('mimic-msg'); // Get message text value
        const logChannel = await getChannel(interaction.guild, lData.chanupchannel);
        
        const mimicEmbed = new EmbedBuilder()
            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 512 }) })
            .setDescription(`${interaction.user} ghostified a message in ${interaction.channel}`)
            .addFields([
                { name: 'Content', value: mimicMessage.slice(0, 1020) }
            ])
            .setTimestamp()

        // Send the message, log that it has been sent, and reply with confirmation
        await interaction.channel.send({ content: mimicMessage });
        await logChannel?.send({ embeds: [mimicEmbed] });
        await interaction.reply({ content: 'Your message has been ghostified.', flags: MessageFlags.Ephemeral });
    }
}