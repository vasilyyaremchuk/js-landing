const fs = require('fs-extra'); // Access to local files
const express = require('express');
const fileUpload = require('express-fileupload');
const basicAuth = require('basic-auth');
const bodyParser = require('body-parser');
const LandingConf = fs.existsSync('./landing-conf.js') ? require('./landing-conf') : {};

const app = express(); // the main app
const admin = express(); // the sub app
const update = express(); // the sub app
const install = express(); // the sub app
const replace = express(); // the sub app
const upload = express(); // the sub app

// Authorization
const auth = function baseAuth(req, res, next) {
  function unauthorized(resurce) {
    resurce.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return resurce.send(401);
  }

  const user = basicAuth(req);

  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  }

  if (user.name === 'root' && user.pass === 'pass4root') {
    return next();
  }
  return unauthorized(res);
};

// site content tokens
const contentData = {};
function getContentData() {
  fs.readdir('content/', (err, items) => {
    if (items !== undefined) {
      for (let i = 0; i < items.length; i += 1) {
        const filename = items[i];
        const fileContent = fs.readFileSync(`content/${filename}`);
        switch (filename.substring(filename.lastIndexOf('.') + 1)) {
          case 'html':
          case 'htm':
          case 'txt':
            contentData[filename] = fileContent.toString();
            break;
          case 'jpg':
          case 'png':
          case 'svg':
            contentData[filename] = `<img src="content/${filename}" />`;
            break;
          default:
            contentData[filename] = `<a href="content/${filename}" target="_blank">${filename}</a>`;
            break;
        }
      }
    }
  });
}

getContentData();

function indexApp(res, adminMode = false) {
  const source = 'content/';
  const filename = 'index.html';
  fs.readFile(source + filename, (err, content) => {
    let result;
    if (err) {
      result = err.message;
    } else {
      const regex = /\{{2}\s*((\w|\.)+)\s*\}{2}/g;
      result = content.toString().replace(regex, (match, group) => {
        if (adminMode === true) {
          const file = match.substring(2, match.length - 2);
          let adminForm;
          switch (file.substring(file.lastIndexOf('.') + 1)) {
            case 'html':
            case 'htm':
            case 'txt':
              adminForm = `<textarea class="js-landing-text js-landing-area js-landing-hide">${contentData[group]}</textarea>`;
              break;
            case 'jpg':
            case 'png':
            case 'svg':
              adminForm = `<div class="js-landing-area js-landing-hide"><img src="content/${file}" height="50px" /><form enctype="multipart/form-data" name="${file}" action="admin/upload" method="post"><input class="js-landing-file" type="file"></form></div>`;
              break;
            default:
              adminForm = `<div class="js-landing-area js-landing-hide"><a href="content/${filename}" target="_blank">${filename}</a><input class="js-landing-file" type="file"></div>`;
              break;
          }
          return (`<span class="js-landing-span" data-file="${file}">${contentData[group]}</span>${adminForm}<a href="#" class="js-landing-edit">edit</a><a href="#" class="js-landing-save js-landing-hide">save</a>`) || match;
        }
        return contentData[group] || match;
      });
    }
    // console.log(result);
    if (adminMode === true) {
      result = result.replace('</body>', '<script src="service/admin.js"></script></body>');
      result = result.replace('</head>', '<link href="service/admin.css" rel="stylesheet"></head>');
    }
    res.status(200).send(result);
  });
}

update.post('/', auth, (req, res) => {
  req.setEncoding('utf8');
  req.on('data', (chunk) => {
    const toSave = JSON.parse(chunk);
    const firstKey = Object.keys(toSave)[0];
    fs.writeFile(`content/${firstKey}`, toSave[firstKey], (err) => {
      if (err) {
        res.send(`Error: ${err}`); // console.log(err);
      } else {
        getContentData();
        res.send(`The fragment ${firstKey} was saved!`);
      }
    });
  });
});

replace.post('/', auth, (req, res) => {
  req.setEncoding('utf8');
  req.on('data', (chunk) => {
    const toSave = JSON.parse(chunk);
    const source = 'content/';
    const filename = 'index.html';
    fs.readFile(source + filename, (err, content) => {
      let result;
      if (err) {
        result = err.message;
      } else {
        const str = content.toString();
        const replaceResult = str.replace(toSave.old, toSave.new);
        fs.writeFile('content/index.html', replaceResult, (werr) => {
          if (werr) {
            result = werr.message;
          } else {
            result = 'index.html was updated!';
          }
        });
      }
      res.status(200).send(result);
    });
  });
});

upload.use(fileUpload());

upload.post('/', auth, (req, res) => {
  if (!req.files) {
    res.status(400).send('No files were uploaded.');
  }
  const firstKey = Object.keys(req.files)[0];
  const sample = req.files[firstKey];
  sample.mv(`content/${sample.name}`, (err) => {
    if (err) {
      res.status(500).send(err);
    }
    res.send('File uploaded!');
  });
});

install.use(bodyParser.urlencoded({ extended: true }));
install.post('/', (req, res) => {
  const configFile = `module.exports = {\n  login: '${req.body.login}',\n  pass: '${req.body.password}',\n  theme: '${req.body.theme}',\n};`;
  fs.writeFile('landing-conf.js', configFile, (werr) => {
    if (werr) {
      res.status(500).send(werr.message);
    } else {
      fs.copy(`themes/${req.body.theme}/content`, 'content', (err) => {
        if (err) {
          res.status(500).send(err.message);
        } else {
          res.writeHead(302, {
            Location: '/',
          });
          getContentData();
          LandingConf.login = req.body.login;
          LandingConf.pass = req.body.password;
          LandingConf.theme = req.body.theme;
          app.use(express.static(`themes/${LandingConf.theme}/static`));
          res.end();
        }
      });
    }
  });
});

admin.get('/', auth, (req, res) => {
  indexApp(res, true);
});

app.get('/', (req, res) => {
  if (typeof LandingConf.theme !== 'undefined') {
    indexApp(res);
  } else {
    fs.readFile('service/install.html', (err, content) => {
      res.status(200).send(content.toString());
    });
  }
});

app.use('/admin', admin); // mount the sub app
app.use('/admin/update', update); // mount the sub-sub app
app.use('/admin/upload', upload); // mount the sub-sub app
app.use('/admin/replace', replace); // mount the sub-sub app
app.use('/install', install); // mount the sub app
app.use('/service', express.static('service'));
app.use('/content', express.static('content'));
if (typeof LandingConf.theme !== 'undefined') {
  app.use(express.static(`themes/${LandingConf.theme}/static`));
} else {
  app.use(express.static('themes/default/static'));
}

app.listen(8000);
