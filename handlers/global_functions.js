const { Discord, EmbedBuilder } = require('discord.js');

function ConfigSuccess(message, content) {

    const configEmbed = new EmbedBuilder()
        .setTitle('Configuration Success')
        .setDescription(content)
        .setColor('ffffff')

    message.reply({ embeds: [configEmbed] });

    console.log(`${content} Change requested by ${message.author.tag}`);

}

function ErrorMessage(message, err) {

    const errorEmbed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription(err)
        .setColor('ffffff')

    message.reply({ embeds: [errorEmbed] });

    console.log(err);

}

function InsufficientArgs(message, expectation, args, syntax) {

    message.reply('Insufficient arguments (expected ' + expectation + '; got ' + args.length + '). Syntax is `' + syntax + '`.');

}

module.exports = { ConfigSuccess, ErrorMessage, InsufficientArgs };