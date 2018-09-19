const https = require('https');
const config = require('./config');
const fs = require('fs');
const request = require('request');


const pinsUrl = `${config.slackApi.url}${config.slackApi.pins}?${config.slackApi.channelIdUrl}&${config.slackApi.tokenUrl}`;
console.log('request pins from: '+pinsUrl);

https.get(pinsUrl, (resp) => {
  let data = '';
  resp.on('data', (chunk) => {
    data += chunk;
  });

  resp.on('end', () => {
    parcePinsData(JSON.parse(data));
  });

}).on("error", (err) => {
  console.log("Error: " + err.message);
});

function parcePinsData(data) {
    console.log('collected '+data.items.length+' pins');
    const pins = data.items.map(item => {
        let pin = {
            createDate: item.created,
            slackUserId: item.created_by
        };

        if(item.type === `file`) {
          console.log(`download file ${item.file.url_private_download}`);
          const fileName = `${config.downloadFolder}/${item.file.id}.${item.file.filetype}`;
          download(item.file.url_private_download, fileName);
          pin = {...pin, file: fileName};
        } 
        else if (item.type === `message`) {
          if (`files` in item.message) {   
            console.log(`download file ${item.message.files[0].url_private_download}`);
            const fileName = `${config.downloadFolder}/${item.message.files[0].id}.${item.message.files[0].filetype}`;
            download(item.message.files[0].url_private_download, fileName);
            pin = {...pin, file: fileName};
          }
          pin = {...pin, message: item.message.text};
        }
        return pin;
    });
    console.log(pins);
}

function download(uri, filename, callback){
    request({
        url: uri,
        headers: {
          'Authorization': `Bearer ${config.slackApi.token}`
        }
      }).pipe(fs.createWriteStream(filename));
  };