const fs = require('fs'); // Access to local files
const express = require('express');
const basicAuth = require('basic-auth');

const app = express(); // the main app
const admin = express(); // the sub app
const update = express(); // the sub-sub app

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
fs.readdir('content/', (err, items) => {
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
    contentData[filename] = fileContent.toString();
  }
});

function indexApp(res, adminMode = false) {
  const source = 'themes/first/paragraphs/';
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
          return (`<span class="js-landing-span" data-file="${file}">${contentData[group]}</span><textarea class="js-landing-area js-landing-hide">${contentData[group]}</textarea><a href="#" class="js-landing-edit">edit</a><a href="#" class="js-landing-save js-landing-hide">save</a>`) || match;
        }
        return contentData[group] || match;
      });
    }
    // console.log(result);
    if (adminMode === true) {
      result = result.replace('</body>', '<script src="service/admin.js"></script></body>');
      result = result.replace('</head>', '<link href="service/admin.css" rel="stylesheet"></head>');
    }
    res.send(200, result);
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
        res.send(`Saved: ${firstKey}`);
      }
    });
  });
});

admin.get('/', auth, (req, res) => {
  indexApp(res, true);
});

app.get('/', (req, res) => {
  indexApp(res);
});

app.use('/admin', admin); // mount the sub app
app.use('/admin/update', update); // mount the sub-sub app
app.use('/service', express.static('service'));
app.use('/content', express.static('content'));
app.use(express.static('themes/first/static'));

app.listen(8000);
