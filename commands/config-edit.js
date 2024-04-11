const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const CONFIG = require('../models/config.js');

const configOptions = ([
    { name: 'Autopublish (Boolean)', value: 'autopublish' },
    { name: 'Discussion Thread Creation (Boolean)', value: 'threadcreation' },
    { name: 'Being Helped Tag Application (Boolean)', value: 'tagapply' },
    { name: 'Automatic Poll Deletion (Boolean)', value: 'autopoll' },
    { name: 'PartyBot Creation Voice Channel (Channel)', value: 'pbvcid' },
    { name: 'PartyBot Default User Limit (Number)', value: 'pbvclimit' },
    { name: 'Pullroom Category (Category)', value: 'pullcategory' },
    { name: 'Pullroom Role (Role)', value: 'pullrole' },
    { name: 'Pullroom Logs (Channel)', value: 'pulllogs' },
    { name: 'Pullroom Message (Message)', value: 'pullmsg' },
    { name: 'ModMail Tickets Category (Category)', value: 'mmcategory' },
    { name: 'Admin/Mod Tickets Category (Category)', value: 'ammcategory' }
]);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config-edit')
        .setDescription('(Admin) Changes configuration settings within the bot')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption((option) =>
            option.setName('config')
                .setDescription('The configuration option that will be edited')
                .addChoices(...configOptions)
                .setRequired(true)
        )
        .addChannelOption((option) =>
            option.setName('category')
                .setDescription('(If configuration requires category) The category that it will be set to')
                .addChannelTypes(ChannelType.GuildCategory)
                .setRequired(false)
        )
        .addChannelOption((option) =>
            option.setName('channel')
                .setDescription('(If configuration requires channel) The channel that it will be set to')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildForum, ChannelType.GuildAnnouncement, ChannelType.GuildVoice)
                .setRequired(false)
        )
        .addRoleOption((option) =>
            option.setName('role')
                .setDescription('(If configuration requires role) The role that it will be set to')
                .setRequired(false)
        )
        .addBooleanOption((option) =>
            option.setName('boolean')
                .setDescription('(If configuration requires boolean) The value that it will be set to')
                .setRequired(false)
        )
        .addStringOption((option) =>
            option.setName('message')
                .setDescription('(If configuration requires message) The message that it will be set to')
                .setRequired(false)
        )
        .addIntegerOption((option) =>
            option.setName('number')
                .setDescription('(If configuration requires number) The number that it will be set to')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(99)
        ),
    async execute(interaction) {
        const configOption = interaction.options.getString('config');

        const categoryOption = interaction.options.getChannel('category');
        const channelOption = interaction.options.getChannel('channel');
        const roleOption = interaction.options.getRole('role');
        const boolOption = interaction.options.getBoolean('boolean');
        const messageOption = interaction.options.getString('message');
        const numberOption = interaction.options.getInteger('number');

        if (!categoryOption && !channelOption && !roleOption && boolOption === null && !messageOption && !numberOption) return interaction.reply({ content: 'Please fill out a configuration value depending on what it requires. The option is labeled in parenthesis after the configuration option (e.g. "Autopublish (Boolean)" requires "boolean" option filled out).' });

        CONFIG.findOne({
            guildID: interaction.guild.id
        }, (err, data) => {
            if (err) return interaction.reply({ content: `Failed to set that configuration option!\n\`${err}\`` });
            if (!data) return interaction.reply({ content: 'Failed to set a configuration value since no data is set up for the server. Use the `/config-setup` command first!' });

            switch (configOption) {
                case "autopublish":
                    if (boolOption === null) return interaction.reply({ content: 'This configuration value requires a `boolean` option to be filled out.' });
                    if (data.autopublish === boolOption) return interaction.reply({ content: 'Autopublishing is already set to that value.' });

                    data.autopublish = boolOption;
                    data.save().catch((err) => console.log(err)).then(() => interaction.reply({ content: `All announcement posts will ${(boolOption == true) ? 'now be autopublished (enabled)' : 'no longer be autopublished (disabled)'}.` }));

                    break;
                case "threadcreation":
                    if (boolOption === null) return interaction.reply({ content: 'This configuration value requires a `boolean` option to be filled out.' });
                    if (data.threadcreate === boolOption) return interaction.reply({ content: 'Discussion thread creation is already set to that value.' });

                    data.threadcreate = boolOption;
                    data.save().catch((err) => console.log(err)).then(() => interaction.reply({ content: `All discussion posts will ${(boolOption == true) ? 'now have a thread created automatically (enabled)' : 'no longer have threads created automatically (disabled)'}.` }));

                    break;
                case "tagapply":
                    if (boolOption === null) return interaction.reply({ content: 'This configuration value requires a `boolean` option to be filled out.' });
                    if (data.tagapply === boolOption) return interaction.reply({ content: 'Being Helped tag application is already set to that value.' });

                    data.tagapply = boolOption;
                    data.save().catch((err) => console.log(err)).then(() => interaction.reply({ content: `All posts being assisted by a staff member will ${(boolOption == true) ? 'now have the \'Being Helped\' tag applied automatically (enabled)' : 'no longer have the \'Being Helped\' tag applied automatically (disabled)'}.` }));

                    break;
                case "autopoll":
                    if (boolOption === null) return interaction.reply({ content: 'This configuration value requires a `boolean` option to be filled out.' });
                    if (data.autopoll === boolOption) return interaction.reply({ content: 'Poll deletion is already set to that value.' });

                    data.autopoll = boolOption;
                    data.save().catch((err) => console.log(err)).then(() => interaction.reply({ content: `All polls posted by non-staff members will ${(boolOption == true) ? 'now be deleted automatically (enabled)' : 'no longer be deleted automatically (disabled)'}.` }));

                    break;
                case "pbvcid":
                    if (!channelOption) return interaction.reply({ content: 'This configuration value requires a `channel` option to be filled out.' });
                    if (data.pbvcid === channelOption.id) return interaction.reply({ content: 'That channel is already in use. ' });
                    if (channelOption.type !== ChannelType.GuildVoice) return interaction.reply({ content: 'That channel is not a voice channel.' });

                    data.pbvcid = channelOption.id;
                    data.save().catch((err) => console.log(err)).then(() => interaction.reply({ content: `PartyBot voice channels will now be created through joining the <#${channelOption.id}> channel.` }));

                    break;
                case "pbvclimit":
                    if (!numberOption) return interaction.reply({ content: 'This configuration value requires a `number` option to be filled out.' });
                    if (data.pbvclimit === numberOption) return interaction.reply({ content: 'That limit is already in use.' });

                    data.pbvclimit = numberOption;
                    data.save().catch((err) => console.log(err)).then(() => interaction.reply({ content: `PartyBot voice channels will now have a default user limit of ${numberOption}.` }));

                    break;
                case "pullcategory":
                    if (!categoryOption) return interaction.reply({ content: 'This configuration value requires a `category` option to be filled out.' });
                    if (data.pullcategoryid === categoryOption.id) return interaction.reply({ content: 'That category is already in use.' });

                    data.pullcategoryid = categoryOption.id;
                    data.save().catch((err) => console.log(err)).then(() => interaction.reply({ content: `Pullroom tickets will now be created in the \`#${categoryOption.name}\` category.` }));

                    break;
                case "pullrole":
                    if (!roleOption) return interaction.reply({ content: 'This configuration value requires a `role` option to be filled out.' });
                    if (data.pullroleid === roleOption.id) return interaction.reply({ content: 'That role is already in use.' });

                    data.pullroleid = roleOption.id;
                    data.save().catch((err) => console.log(err)).then(() => interaction.reply({ content: `Members who are pullroomed will now be given the <@&${roleOption.id}> role.` }));

                    break;
                case "pulllogs":
                    if (!channelOption) return interaction.reply({ content: 'This configuration value requires a `channel` option to be filled out.' });
                    if (data.pulllogid === channelOption.id) return interaction.reply({ content: 'That channel is already in use.' });

                    data.pulllogid = channelOption.id;
                    data.save().catch((err) => console.log(err)).then(() => interaction.reply({ content: `Pullroom tickets will now be logged in the <#${channelOption.id}> channel.` }));

                    break;
                case "pullmsg":
                    if (!messageOption) return interaction.reply({ content: 'This configuration value requires a `message` option to be filled out.' });

                    data.pullmsg = messageOption;
                    data.save().catch((err) => console.log(err)).then(() => interaction.reply({ content: `Pullroom tickets will now start out with the following message: \`${messageOption}\`` }));

                    break;
                case "mmcategory":
                    if (!categoryOption) return interaction.reply({ content: 'This configuration value requires a `category` option to be filled out.' });
                    if (data.mmcategoryid === categoryOption.id) return interaction.reply({ content: 'That category is already in use.' });

                    data.mmcategoryid = categoryOption.id;
                    data.save().catch((err) => console.log(err)).then(() => interaction.reply({ content: `ModMail ticket related commands will now function in the \`#${categoryOption.name}\` category.` }));

                    break;
                case "ammcategory":
                    if (!categoryOption) return interaction.reply({ content: 'This configuration value requires a `category` option to be filled out.' });
                    if (data.ammcategoryid === categoryOption.id) return interaction.reply({ content: 'That category is already in use.' });

                    data.ammcategoryid = categoryOption.id;
                    data.save().catch((err) => console.log(err)).then(() => interaction.reply({ content: `Admin/Mod ModMail ticket related commands will now function in the \`#${categoryOption.name}\` category.` }));

                    break;
                default:
                    interaction.reply({ content: 'That is not a configuration value.' });

                    break;
            }
        });
    },
};