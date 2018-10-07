const https = require('https');
const {slackApi, downloadFolder} = require('./config');
const fs = require('fs');
const request = require('request');
const fetch = require('node-fetch');
const Promise_serial = require('promise-serial');

const pinsUrl = `${slackApi.url}${slackApi.pins}?${slackApi.channelIdUrl}&${
  slackApi.tokenUrl
}`;

console.log('request pins from: ' + pinsUrl);

const download = (uri, filename, callback) => {
  request({
    url: uri,
    headers: {
      Authorization: `Bearer ${slackApi.token}`,
    },
  }).pipe(fs.createWriteStream(filename));
};

const ensureFolder = dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
};

const parcePinsData = async ({items}) => {
  console.log('collected ' + items.length + ' pins');
  await Promise_serial(
    items.map(({created, created_by, type, file, message}) => async () => {
      let date = new Date(created * 1000);
      let pin = {
        createDate: date.toISOString(),
        slackUserId: created_by,
      };

      // const t = await fetch('https://slack.com/api/users.identity', {
      //   headers: {
      //     Authorization: `Bearer ${slackApi.token}`,
      //   },
      // }).then(res => res.json());

      const folder = `${downloadFolder}/${pin.createDate}`;
      ensureFolder(folder);

      if (type === `file`) {
        const {url_private_download, id, filetype} = file;
        console.log(`download file ${url_private_download}`);

        const fileName = `${folder}/file.${filetype}`;
        download(url_private_download, fileName);
        pin = {...pin, file: fileName};
      } else if (type === `message`) {
        if (`files` in message) {
          const {files} = message;
          const [file] = files;
          const {url_private_download, id, filetype} = file;
          console.log(`download file ${url_private_download}`);
          const fileName = `${folder}/file.${filetype}`;
          download(url_private_download, fileName);
          pin = {...pin, file: fileName};
        }
        pin = {...pin, message: message.text};
      }

      fs.writeFileSync(
        `${folder}/meta.json`,
        JSON.stringify(pin, null, 2),
        'utf8',
      );
      return pin;
    }),
  );
};

fetch(pinsUrl)
  .then(res => res.json())
  .then(parcePinsData)
  .catch(err => {
    console.log('Error: ' + err.message);
  });
