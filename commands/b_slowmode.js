const sf = require('seconds-formater');
const fc = require('../handlers/global_functions.js');

module.exports = {
    name: 'slowmode',
    aliases: ['cooldown', 'setslowmode', 'ratelimit'],
    description: 'This command sets the slowmode of a channel or views all channel slowmodes',
    category: 'mod',
    syntax: 'slowmode (view)|(<channel> <seconds>)',
    async execute(client, message, args) {

        if (!args[0]) return fc.InsufficientArgs(message, 2, args, module.exports.syntax);

        const optArg = args[0].toLowerCase();
        const toChannelChange = message.mentions.channels.first() || message.guild.channels.cache.get(optArg);

        const rateLimitPerUser = parseInt(args[1]);

        if (optArg) {

            if (optArg === 'view') {

                const phasmophobiaCat = message.guild.channels.cache.get('754890847635505283');
                const otopicCat = message.guild.channels.cache.get('865111206346883112');

                const phasmophobiaParent = phasmophobiaCat.children.cache.filter((channel) => channel.rateLimitPerUser !== 0);
                const otopicParent = otopicCat.children.cache.filter((channel) => channel.rateLimitPerUser !== 0);

                let mappedPCats = phasmophobiaParent.map((pChan) => `<#${pChan.id}>: **${sf.convert(pChan.rateLimitPerUser || 0).format('MM:SS')}** slowmode`).join('\n');
                let mappedOCats = otopicParent.map((oChan) => `<#${oChan.id}>: **${sf.convert(oChan.rateLimitPerUser || 0).format('MM:SS')}** slowmode`).join('\n');

                message.reply(`Showcasing slowmodes for our two main categories (\`#${phasmophobiaCat.name}\` and \`#${otopicCat.name}\`):\n\n${mappedPCats}\n${mappedOCats}`);

            } else {

                if (!args[1]) return fc.InsufficientArgs(message, 2, args, module.exports.syntax);
                if (!toChannelChange || !message.guild.channels.cache.get(toChannelChange.id)) return message.reply('Invalid channel, or channel not found. Please make sure the channel is text/voice!')
                if (isNaN(parseInt(rateLimitPerUser)) || parseInt(rateLimitPerUser) > 21600) return message.reply('Invalid integer (not a number, or not through 1 to 21600).');

                toChannelChange.setRateLimitPerUser(rateLimitPerUser).then(() => {

                    if (rateLimitPerUser === 0) message.reply(`Successfully disabled <#${toChannelChange.id}>'s slowmode (**${toChannelChange.rateLimitPerUser.toLocaleString()} seconds**).`);

                    if (rateLimitPerUser !== 0) message.reply(`Successfully set <#${toChannelChange.id}>'s slowmode to **${toChannelChange.rateLimitPerUser.toLocaleString()} seconds** (${sf.convert(toChannelChange.rateLimitPerUser || 0).format('MM:SS')}).`);

                });

            }

        }

    }

};