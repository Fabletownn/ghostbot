const mongoose = require('mongoose');

const subSchema = mongoose.Schema({
    guildID: String,
    postID: String,
    originalPoster: String,
    subbedMembers: Array,
    alreadyPosted: Boolean
});

module.exports = mongoose.model('subs', subSchema);

// This model is meant to track staff members subscribing to tech-support posts, how many are subscribed, and if they're eligible to be alerted again
// c_subscribe.js, c_unsubscribe.js, messageCreate.js