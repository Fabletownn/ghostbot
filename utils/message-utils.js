const { escapeMarkdown } = require('discord.js');

function escapeAllMarkdown(content, newlines = false) {
    if (!content) return '(No Content)';
    
    // Escape all markdown
    content = escapeMarkdown(content, { 
        blockQuote: true,
        bold: true,
        bulletedList: true,
        codeBlock: true,
        escape: true,
        heading: true,
        inlineCode: true,
        italic: true,
        maskedLink: true,
        numberedList: true,
        quote: true,
        spoiler: true,
        strikethrough: true,
        underline: true
    });
    
    // Escape pings, quotes (as above method does not work), links
    content = content.replace(/([/<>-])/g, '$1\u200b');
    
    // Remove new lines if the parameter asks for it
    if (newlines)
        content = content.replace(/\n/g, ' ... ');
    
    return content;
}

function channelText(content) {
    return content.replace(/[^a-zA-Z0-9]+/g, '').toLowerCase();
}

function pluralize(word, count) {
    return (count === 0 || count > 1) ? `${word}s` : word;
}

function randomize(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function truncate(content, limit) { // more readable this way
    return content.slice(0, limit);
}

module.exports = {
    escapeAllMarkdown,
    channelText,
    pluralize,
    randomize,
    truncate
};
