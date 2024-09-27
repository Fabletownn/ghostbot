const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const SUB = require('../models/subscriptions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('subscribe')
        .setDescription('(Staff) Subscribe to a tech support forum post')
        .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),
    async execute(interaction) {
        const techChannels = ['1034230224973484112', '1034231311147216959', '1034278601060777984', '1082421799578521620', '1020011442205900870'];

        if (!(techChannels.some((chID) => interaction.channel.parent.id === chID)) || interaction.channel.type !== ChannelType.PublicThread) return interaction.reply({ content: 'The channel you are currently in is not a support thread and therefore is not supported with this command.', ephemeral: true });

        const data = await SUB.findOne({
            guildID: interaction.guild.id,
            postID: interaction.channel.id
        });

        if (!data) {
            if (interaction.channel.ownerId !== interaction.user.id) {
                const newSubData = new SUB({
                    guildID: interaction.guild.id,
                    postID: interaction.channel.id,
                    op: interaction.channel.ownerId || '',
                    subbed: [interaction.user.id],
                    posted: false
                });

                await newSubData.save().catch((err) => console.log(err));

                await interaction.reply({ content: 'You are now subscribed to this thread. Make sure your messages are enabled!', ephemeral: true });
            } else {
                return interaction.reply({ content: 'You cannot subscribe to a thread that you own.', ephemeral: true });
            }
        } else if (data) {
            if (!data.subbed.includes(interaction.user.id)) {
                if (data.op !== interaction.user.id) {
                    data.subbed.push(interaction.user.id);
                    await data.save().catch((err) => console.log(err));

                    await interaction.reply({ content: `You are now subscribed to this thread alongside **${data.subbed.length} other staff members**. Make sure your messages are enabled!`, ephemeral: true });
                }
            } else {
                return interaction.reply({ content: 'You are already subscribed to this thread. Unsubscribe using the `/unsubscribe` command.', ephemeral: true });
            }
        }
    },
};