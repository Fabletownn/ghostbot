const mongoose = require('mongoose');

const reportSchema = mongoose.Schema({
    userID: String,
    reports: Map,
    reportID: String,
    emergency: Boolean
});

module.exports = mongoose.model('reports', reportSchema);

// This model is meant for storing user reports, and stacking reports without spamming them
// report-message.js, interactionCreate.js

