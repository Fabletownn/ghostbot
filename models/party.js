const mongoose = require('mongoose');

const partySchema = mongoose.Schema({
    voiceID: String,
    ownerID: String
});

module.exports = mongoose.model('party', partySchema);

// This model is meant to track PartyBot channels and owners
// voiceStateUpdate.js & vc.js