const CONFIG = require('../models/config.js');
const LOG_CONFIG = require('../models/logconfig.js');

function createDefaultConfig(guildID) {
    return new CONFIG({
        guildID: guildID,
        autopublish: false,
        threadcreate: false,
        pbvcid: '',
        pbvclimit: 4,
        pullcategoryid: '',
        pullroleid: '',
        pulllogid: '',
        pullmsg: ''
    });
}

function createDefaultLogConfig(guildID) {
    return new LOG_CONFIG({
        guildID: guildID,
        deletechannel: '',
        editchannel: '',
        ignoredchannels: [],
        ignoredcategories: [],
        deletewebhook: '',
        editwebhook: '',
        usernamewebhook: '',
        vcwebhook: '',
        chanupwebhook: '',
        usernamechannel: '',
        vcchannel: '',
        chanupchannel: ''
    });
}

async function cacheConfigData(client) {
    try {
        const newData = await CONFIG.findOne({ guildID: process.env.GUILDID }).lean();
        if (!newData) throw new Error('Failed to cache configuration data, none found');
        
        client.cachedConfig = newData;
        console.log('Cached configuration data', newData);
    } catch (error) {
        trailError(error);
    }
}

async function cacheLogConfigData(client) {
    try {
        const newData = await LOG_CONFIG.findOne({ guildID: process.env.GUILDID }).lean();
        if (!newData) throw new Error('Failed to cache log configuration data, none found');

        client.cachedLogConfig = newData;
        console.log('Cached log configuration data', newData);
    } catch (error) {
        trailError(error);
    }
}

module.exports = {
    createDefaultConfig,
    createDefaultLogConfig,
    cacheConfigData,
    cacheLogConfigData
};