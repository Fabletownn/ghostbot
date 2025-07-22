const mongoose = require('mongoose');

const reportSchema = mongoose.Schema({
    userID: String,
    reports: Map,
    reportID: String,
    emergency: Boolean,
    profile: Boolean,
    handled: Boolean,
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // Delete the entry automatically once the report expires
    }
});

module.exports = mongoose.model('reports', reportSchema);

// This model is meant for storing user reports, and stacking reports without spamming them
// report-message.js, interactionCreate.js

