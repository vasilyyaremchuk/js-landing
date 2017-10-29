const fs = require('fs'); // Access to local files
const express = require('express');
const basicAuth = require('express-basic-auth');

const app = express(); // the main app
const admin = express(); // the sub app
// const update = express(); // the sub-sub app

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
        let matchResult;
        if (adminMode === true) {
          const file = match.substring(2, match.length - 2);
          matchResult = (`<span class="js-landing-span" data-file="${file}">${contentData[group]}</span><textarea class="js-landing-area js-landing-hide">${contentData[group]}</textarea><a href="#" class="js-landing-edit">edit</a><a href="#" class="js-landing-save js-landing-hide">save</a>`) || match;
        } else {
          matchResult = contentData[group] || match;
        }
        return matchResult;
      });
    }
    // console.log(result);
    if (adminMode === true) {
      result = result.replace('</body>', '<script src="service/admin.js"></script></body>');
      result = result.replace('</head>', '<link href="service/admin.css" rel="stylesheet"></head>');
    }
    res.send(result);
  });
}

/* update.use(basicAuth({
  users: { admin: 'pass' },
})); */

/* update.get('/', (req, res) => {
  res.send('it works!');
}); */

admin.get('/', (req, res) => {
  indexApp(res, true);
});

admin.use(basicAuth({
  users: { 'root': 'supersecret' }
}));

app.get('/', (req, res) => {
  indexApp(res);
});

app.use('/admin', admin); // mount the sub app
// admin.use('/save', update); // mount the sub app
app.use('/service', express.static('service'));
app.use('/content', express.static('content'));
app.use(express.static('themes/first/static'));

app.listen(3000);
