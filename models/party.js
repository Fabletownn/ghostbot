const mongoose = require('mongoose');

const partySchema = mongoose.Schema({
    voiceID: String,
    ownerID: String
});

module.exports = mongoose.model('party', partySchema);