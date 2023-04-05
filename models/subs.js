const mongoose = require('mongoose');

const subSchema = mongoose.Schema({
    guildID: String,
    postID: String,
    originalPoster: String,
    subbedMembers: Array,
    alreadyPosted: Boolean
});

module.exports = mongoose.model('subs', subSchema);