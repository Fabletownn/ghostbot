const mongoose = require('mongoose');

const subSchema = mongoose.Schema({
    guildID: String,
    postID: String,
    op: String,
    subbed: Array,
    posted: Boolean
});

module.exports = mongoose.model('subs', subSchema);

// This model is meant to track staff members subscribing to tech-support posts, how many are subscribed, and if they're eligible to be alerted again
// subscribe.js, unsubscribe.js, messageCreate.js