const http = require('http'); // API HTTP-server
const fs = require('fs'); // Access to local files
const url = require('url');

const server = new http.Server(); // create a new HTTP-server
server.listen(8000); // port 8000.

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

server.on('request', (request, response) => {
  const appUrl = url.parse(request.url);
  let adminMode = false;
  let filename = appUrl.pathname.substring(1);
  if (appUrl.pathname === '/' || appUrl.pathname === '' || appUrl.pathname === '/admin' || appUrl.pathname === '/admin/save') {
    filename = 'index.html';
    if (appUrl.pathname === '/admin' || appUrl.pathname === '/admin/save') {
      adminMode = true;
    }
  }

  let type;
  switch (filename.substring(filename.lastIndexOf('.') + 1)) {
    case 'html':
    case 'htm':
      type = 'text/html; charset=UTF-8';
      break;
    case 'js':
      type = 'application/javascript; charset=UTF-8';
      break;
    case 'css':
      type = 'text/css; charset=UTF-8';
      break;
    case 'txt':
      type = 'text/plain; charset=UTF-8';
      break;
    // case "manifest":
    //  type = "text/cache-manifest; charset=UTF-8";
    //  break;
    default:
      type = 'application/octet-stream';
      break;
  }

  let source = 'markup/';
  const initialPath = appUrl.pathname.substring(0, 9);
  if (initialPath === '/service/' || initialPath === '/content/') {
    source = '';
  }

  // console.log("Read file: " + source + filename);
  if (appUrl.pathname === '/admin/save') {
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      const toSave = JSON.parse(chunk);
      const firstKey = Object.keys(toSave)[0];
      fs.writeFile(`content/${firstKey}`, toSave[firstKey], (err) => {
        if (err) {
          // console.log(err);
        }
        // console.log("The file was saved!");
      });
    });
    response.writeHead(200, { 'Content-Type': type });
    response.write('Done!');
    response.end();
  } else {
    fs.readFile(source + filename, (err, content) => {
      if (err) {
        // console.log(filename + " not found!");
        response.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
        response.write(err.message);
        response.end();
      } else {
        let fileContent = content;
        if (filename === 'index.html') {
          const regex = /\{{2}\s*((\w|\.)+)\s*\}{2}/g;

          // console.log(contentData);
          const result = content.toString().replace(regex, (match, group) => {
            let matchResult;
            if (adminMode === true) {
              const file = match.substring(2, match.length - 2);
              matchResult = (`<span class="js-landing-span" data-file="${file}">${contentData[group]}</span><textarea class="js-landing-area js-landing-hide">${contentData[group]}</textarea><a href="#" class="js-landing-edit">edit</a><a href="#" class="js-landing-save js-landing-hide">save</a>`) || match;
            } else {
              matchResult = contentData[group] || match;
            }
            return matchResult;
          });

          fileContent = result;
        }
        if (adminMode === true) {
          const auth = request.headers.authorization;
          // auth is in base64(username:password)  so we need to decode the base64
          // console.log('Authorization Header is: ', auth);

          if (!auth) {
            // No Authorization header was passed in so it's the first time the browser hit us
            response.statusCode = 401;
            response.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
            response.end('<html><body>Protected Admin Area.</body></html>');
          } else if (auth) {
            // The Authorization was passed in so now we validate it
            const tmp = auth.split(' ');
            // Split on a space, the original auth looks like
            // "Basic Y2hhcmxlczoxMjM0NQ==" and we need the 2nd part

            const buf = Buffer.from(tmp[1], 'base64');
            // create a buffer and tell it the data coming in is base64
            const plainAuth = buf.toString();
            // read it back out as a string

            // console.log("Decoded Authorization ", plainAuth);

            // At this point plainAuth = "username:password"

            const creds = plainAuth.split(':'); // split on a ':'
            const username = creds[0];
            const password = creds[1];

            if ((username === 'admin') && (password === 'admin')) { // Is the username/password correct?
              response.writeHead(200, { 'Content-Type': type });
              fileContent = fileContent.replace('</body>', '<script src="service/admin.js"></script></body>');
              fileContent = fileContent.replace('</head>', '<link href="service/admin.css" rel="stylesheet"></head>');
              response.write(fileContent);
              response.end();
            } else {
              response.statusCode = 401; // Force them to retry authentication
              response.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
              // response.statusCode = 403;
              // or alternatively just reject them altogether with a 403 Forbidden
              response.end('<html><body>Access Denied!</body></html>');
            }
          }
        } else {
          response.writeHead(200, { 'Content-Type': type });
          response.write(fileContent);
          response.end();
        }
      }
    });
  }
});
