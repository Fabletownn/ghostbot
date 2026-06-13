const { MessageFlags, EmbedBuilder} = require('discord.js');
const {getChannel} = require("../../utils/fetch-utils");

module.exports = {
    customId: 'edit-message-modal',

    async execute(interaction) {
        // Get and check existing log configuration data
        const lData = interaction.client.cachedLogConfig;
        if (!lData) return interaction.reply({ content: 'There is no logging configuration data yet.', flags: MessageFlags.Ephemeral });

        const editedMessage = interaction.fields.getTextInputValue('edit-message-body');
        const messageInformation = interaction.customId.split(':')[1];
        const editChannelID = messageInformation.split('-')[0];
        const editMessageID = messageInformation.split('-')[1];
        
        const logChannel = await getChannel(interaction.guild, lData.chanupchannel);
        const editEmbed = new EmbedBuilder()
            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 512 }) })
            .setDescription(`${interaction.user} edited a message in ${interaction.channel}`)
            .addFields([
                { name: 'New Content', value: editedMessage.slice(0, 1020) }
            ])
            .setTimestamp()
        
        // Defer as logging and editing may take some time
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // Attempt to edit and log the message
        try {
            const fetchedMessage = await interaction.guild.channels.cache.get(editChannelID).messages.fetch(editMessageID);
            
            await fetchedMessage.edit({ content: editedMessage });
            await logChannel?.send({ embeds: [editEmbed] });
            await interaction.followUp({ content: 'Successfully modified message.' });

        // Reply with the error if any
        } catch (err) {
            return interaction.followUp({ content: `Something went wrong trying to edit that message: **${err.message}**`, flags: MessageFlags.Ephemeral });
        }
    }
}