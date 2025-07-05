const { SlashCommandBuilder, MessageFlags, PermissionFlagsBits, ChannelType } = require('discord.js');
const SUB = require('../models/subscriptions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('subscribe')
        .setDescription('Subscribe to a tech support forum post')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    async execute(interaction) {
        const techChannels = ['1082421799578521620', '1020011442205900870']; // Tech & VR Tech support channels

        if (!(techChannels.some((chID) => interaction.channel.parent.id === chID)) || (interaction.channel.type !== ChannelType.PublicThread))
            return interaction.reply({ content: 'The channel you are currently in is not a support thread and therefore is not supported with this command.', flags: MessageFlags.Ephemeral });

        const data = await SUB.findOne({ guildID: interaction.guild.id, postID: interaction.channel.id }); // Get already existing subscription data

        // If there is no already existing subscription data for the thread, create data
        if (!data) {
            if (interaction.channel.ownerId !== interaction.user.id) {
                const newSubData = new SUB({
                    guildID: interaction.guild.id,
                    postID: interaction.channel.id,
                    op: interaction.channel.ownerId || '',
                    subbed: [interaction.user.id],
                    posted: false
                });

                await newSubData.save().catch((err) => trailError(err));
                await interaction.reply({ content: 'You are now subscribed to this thread. Make sure your messages are enabled!', flags: MessageFlags.Ephemeral });
            } else {
                return interaction.reply({ content: 'You cannot subscribe to a thread that you own.', flags: MessageFlags.Ephemeral });
            }
            
        // If 1 or more users are subscribed already, push the user into the subscribed users list and save it
        } else if (data) {
            if (!data.subbed.includes(interaction.user.id)) {
                if (data.op !== interaction.user.id) {
                    data.subbed.push(interaction.user.id);
                    
                    await data.save().catch((err) => trailError(err));
                    await interaction.reply({ content: `You are now subscribed to this thread alongside **${data.subbed.length} other staff members**. Make sure your messages are enabled!`, flags: MessageFlags.Ephemeral });
                }
            } else {
                return interaction.reply({ content: 'You are already subscribed to this thread. Unsubscribe using the `/unsubscribe` command.', flags: MessageFlags.Ephemeral });
            }
        }
    },
};