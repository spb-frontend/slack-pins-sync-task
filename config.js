var secret = require('./secret.json');

var config = {};

config = {
    slackApi:{
        channelId: 'C2311GRT7',
        channelIdUrl: 'channel=C2311GRT7',
        url: 'https://slack.com/api/',
        pins: 'pins.list',
        token: secret.token,
        tokenUrl: 'token='+secret.token,
    }, 
    downloadFolder: './images',
};

module.exports = config;