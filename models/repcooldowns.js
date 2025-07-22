const mongoose = require('mongoose');

const cooldownSchema = mongoose.Schema({
    guildID: String,
    userID: String,
    blacklisted: Boolean,
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // Delete the entry automatically once cooldown has ended
    }
});

module.exports = mongoose.model('repcooldowns', cooldownSchema);

// This model is meant to keep information on users who report others, and whether they are blacklisted or on cooldown from using the system
// interactionCreate.js, report-block.js, report-unblock.js