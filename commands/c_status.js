const STATUS = require('../models/statuses.js');
const fc = require('../handlers/global_functions.js');

module.exports = {
    name: 'status',
    aliases: ['botstatus'],
    description: 'Allows staff to add a status for the bot to use',
    category: 'staff',
    syntax: 'status [add|remove] [content]',
    async execute(client, message, args) {
        if (!args[0]) return fc.InsufficientArgs(message, 2, args, module.exports.syntax);

        const arArg = args[0].toLowerCase();

        if (!args[1]) return fc.InsufficientArgs(message, 2, args, module.exports.syntax);

        const contentArg = args.slice(1).join(' ');

        STATUS.findOne({
            guildID: message.guild.id
        }, async (err, data) => {
            if (err) return console.log(err);

            if (contentArg.length > 128) return message.reply('Please try and condense the status `' + contentArg + '` into something shorter (want max 128, got ' + contentArg.length + ').');

            if (arArg === 'add') {
                if (!data) {
                    const newStatusData = new STATUS({
                        guildID: message.guild.id,
                        statuses: ['Phasmophobia', contentArg]
                    });

                    await newStatusData.save().catch((err) => console.log(err)).then(async () => {
                        await message.reply(`Successfully added status \`${contentArg}\` at **index ${newStatusData.statuses.indexOf(contentArg) || '?'}**.`);
                    });
                } else if (data) {
                    data.statuses.push(contentArg);

                    data.save().catch((err) => console.log(err)).then(async () => {
                        await message.reply(`Successfully added status \`${contentArg}\` at **index ${data.statuses.indexOf(contentArg) || '?'}**.`);
                    });
                }
            } else if (arArg === 'remove' || arArg.startsWith('del')) {
                if (data) {
                    if (isNaN(contentArg) || parseInt(contentArg) === 0) return message.reply('Unknown index number (value provided was not a number).');

                    const indexContent = data.statuses.at(parseInt(contentArg));

                    if (data.statuses[parseInt(contentArg)]) {
                        data.statuses[parseInt(contentArg)] = null;

                        data.save().catch((err) => console.log(err)).then(async () => {
                            await message.reply(`Successfully removed status \`${indexContent}\`, previously in **index ${contentArg}**.`);
                        });
                    } else {
                        message.reply('Unknown index number (value provided was not found).');
                    }
                } else {
                    return message.reply('There is no data to remove.');
                }
            } else {
                return message.reply('Unknown parameter(s). The syntax is `' + module.exports.syntax + '`.');
            }
        });
    }
};