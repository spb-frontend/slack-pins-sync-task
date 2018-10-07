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
  const idNameMap = await fetch('https://slack.com/api/users.list', {
    headers: {
      Authorization: `Bearer ${slackApi.token}`,
    },
  })
    .then(res => res.json())
    .then(({members}) => {
      // console.log(Object.keys(map));
      const res = {};
      members.forEach(({id, name}) => {
        res[id] = name;
      });
      return res;
    });

  console.log('collected ' + items.length + ' pins');
  await Promise_serial(
    items.map(({created, created_by, type, file, message}) => async () => {
      let date = new Date(created * 1000);
      let pin = {
        createDate: date.toISOString(),
        slackUserId: idNameMap[created_by],
      };

      // regexp messages and replace by map on mentions
      // <@U4HLJR64V>

      // get image name and add to meta

      // get who is author of message and add to meta

      // get avatars of users related of message (author and who pinned)

      // get custom emojies and apply to message (?)

      // check links if image - download it (?)

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
