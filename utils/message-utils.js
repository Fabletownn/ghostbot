function sanitizeMessage(content, limit = 0) {
    if (!content) return '(No Content)';
    
    // Replace Discord emotes
    content = content.replace(/<a?:\w+:\d+>/g, '(Emote)');
    
    // Replace links
    content = content.replace(/https?:\/\/\S+/g, '(Link)');
    
    let trimmed = limit > 0 ? Array.from(content).slice(0, limit).join('') : content;
    
    // Replace emojis
    trimmed = trimmed.replace(/\p{Emoji_Presentation}/gu, '(Emoji)');
    
    // Escape all markdown and new lines
    trimmed = trimmed.replace(/([\\`*_{}\[\]#|<>])/g, '\\$1')
                     .replace(/\n/g, '...');
    
    return trimmed;
}

function channelText(content) {
    return content.replace(/[^a-zA-Z0-9]+/g, '').toLowerCase();
}

function pluralize(word, count) {
    return (count === 0 || count > 1) ? `${word}s` : word;
}

module.exports = {
    sanitizeMessage,
    channelText,
    pluralize
};
