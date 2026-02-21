function sanitizeMessage(content, limit = 0) {
    if (limit === 0) limit = content.length; // If there is no set limit, make it however long the message is
    if (!content) return '(No Content)';

    return content.replace(/`/g, '\\`').replace(/\*/g, '\\*').replace(/-/g, '\\-').replace(/_/g, '\\_')
        .replace(/</g, '\\<').replace(/>/g, '\\>').replace(/\//g, '\\/')
        .replace(/\n/g, '...')
        .slice(0, limit);
}

function channelText(content) {
    return content.replace(/[^a-zA-Z0-9]+/g, '').toLowerCase();
}

module.exports = {
    sanitizeMessage,
    channelText
};
