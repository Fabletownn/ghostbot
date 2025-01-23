const mongoose = require('mongoose');

const deletelogSchema = mongoose.Schema({
    guildID: String,
    overload: Number,
    embed: Array
});

module.exports = mongoose.model('deletes', deletelogSchema);

// This model is meant to submit deleted messages every 5 seconds (e.g. instead of spamming the bot & log channel
// everytime a message is deleted, if 9 messages are deleted in under 5 seconds, it'll send them all in one message)
// messageDelete.js & messageUpdate.js & messageBulkDelete.js