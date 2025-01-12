const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const SUB = require('../models/subscriptions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unsubscribe')
        .setDescription('Unsubscribe from a tech support forum post(s)')
        .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers)
        .addBooleanOption((option) =>
            option.setName('nuke-subscriptions')
                .setDescription('If you would like to unsubscribe from every subscribed thread')
                .setRequired(false)
        ),
    async execute(interaction) {
        const nukeOption = interaction.options.getBoolean('nuke-subscriptions');

        const techChannels = ['1034230224973484112', '1034231311147216959', '1034278601060777984', '1082421799578521620', '1020011442205900870'];

        if (!(techChannels.some((chID) => interaction.channel.parent.id === chID)) || interaction.channel.type !== ChannelType.PublicThread) return interaction.reply({ content: 'The channel you are currently in is not a support thread and therefore is not supported with this command.', ephemeral: true });

        if (nukeOption !== null && nukeOption === true) {
            const subbedthreads = await SUB.find({
                subbed: interaction.user.id
            });

            await subbedthreads.forEach((sub) => {
                const subbedList = sub.subbed;

                if (subbedList.length > 1) { // If there's multiple people subscribed, remove their ID only
                    const subIndex = subbedList.indexOf(interaction.user.id);

                    if (subIndex !== -1) {
                        subbedList.splice(subIndex, 1);
                        sub.save().catch((err) => console.log(err));
                    }
                } else { // Otherwise delete it entirely
                    sub.delete().catch((err) => console.log(err));
                }
            });

            await interaction.reply({ content: 'You have been unsubscribed from all threads successfully.', ephemeral: true });
        }
        else if (nukeOption === null || nukeOption === false) {
            const data = await SUB.findOne({
                guildID: interaction.guild.id,
                postID: interaction.channel.id
            });
            
            if (!data) return interaction.reply({ content: 'You are not subscribed to this thread. Subscribe using the `/subscribe` command.', ephemeral: true });

            if (data.subbed.includes(interaction.user.id)) {
                const subIndex = data.subbed.indexOf(interaction.user.id) || null;

                if (subIndex < 0) return interaction.reply({ content: 'Failed to unsubscribe to the thread as something went wrong.', ephemeral: true });

                data.subbed.splice(subIndex, 1);
                await data.save().catch((err) => console.log(err));

                if (data.subbed.length <= 0) await data.delete();

                await interaction.reply({ content: 'You have been unsubscribed from this thread.', ephemeral: true });
            }
        }
    },
};