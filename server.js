var http = require('http'); // API HTTP-сервера
var fs = require('fs'); // Для работы с локальными файлами
var server = new http.Server(); // Создать новый HTTP-сервер
server.listen(8000); // Прослушивать порт 8000.


// site content tokens
var content_data = {};
fs.readdir('content/', function(err, items) {
	for (var i=0; i<items.length; i++) {
		var file_content = fs.readFileSync('content/' + items[i]);
		var filename = items[i];
		switch(filename.substring(filename.lastIndexOf(".")+1)) { 
			case "html":
			case "htm":
			case "txt": 
				content_data[filename] = file_content.toString();
			break;
			case "jpg":
			case "png":
			case "svg":
				content_data[filename] = '<img src="content/' + filename + '" />';
			break;
			default: 
				content_data[filename] = '<a href="content/' + filename + '" target="_blank">' + filename + '</a>'; 
			break;
		}	
		content_data[filename] = file_content.toString();
	}
});

server.on("request", function (request, response) {
	var url = require('url').parse(request.url);
	var admin_mode = false;
	var filename = url.pathname.substring(1); 
	if (url.pathname === "/" || url.pathname === "" || url.pathname === "/admin" || url.pathname === "/admin/save") {
		var filename = "index.html";
		if (url.pathname === "/admin" || url.pathname === "/admin/save") {
			admin_mode = true;
		}
	}

	var type;
	switch(filename.substring(filename.lastIndexOf(".")+1)) { 
		case "html":
		case "htm": 
			type = "text/html; charset=UTF-8"; 
		break;
		case "js": 
			type = "application/JavaScript; charset=UTF-8"; 
		break;
		case "css": 
			type = "text/css; charset=UTF-8"; 
		break;
		//case "txt" : 
		//	type = "text/plain; charset=UTF-8"; 
		//break;
		//case "manifest": 
		//	type = "text/cache-manifest; charset=UTF-8"; 
		//break;
		default: 
			type = "application/octet-stream"; 
		break;
	}
	//console.log(filename);
	//process.chdir("markup");
	/*var content = fs.readFileSync("markup/" + filename);
	response.writeHead(200, 
		{"Content-Type": type});
	response.write(content); 
	response.end(); */
	var source = "markup/";
	var initial_path = url.pathname.substring(0, 9);
	if (initial_path === "/service/" || initial_path ==="/content/") {
		source = "";		
	}

	//console.log("Read file: " + source + filename);
	if(url.pathname === "/admin/save") {
		request.setEncoding('utf8');

	    request.on('data', function (chunk) {
	    	var to_save = JSON.parse(chunk);
	    	for (var prop in to_save) {
			  fs.writeFile("content/" + prop, to_save[prop], function(err) {
				    if(err) {
				        return console.log(err);
				    }
				    console.log("The file was saved!");
				});
			}
	    });
		response.writeHead(200, 
			{"Content-Type": type});
		response.write("Done!"); 
		response.end(); 
	}
	else {
		fs.readFile(source + filename, function(err, content) {
			if (err) { 
				console.log(filename + " not found!");
				response.writeHead(404, { 
					"Content-Type": "text/plain; charset=UTF-8"});
				response.write(err.message); 
				response.end(); 
			}
			else { 
				if (filename == 'index.html') {
					var regex = /\{{2}\s*((\w|\.)+)\s*\}{2}/g;

					//console.log(content_data);
					var result = content.toString().replace(regex, function(match, group) {
					  //console.log(group)
					  /*var path = group.split('.');
					  var current = data;
					  while(path.length && current){
					    current = current[path.shift()];
					  }*/
					  //console.log(current);
					  //console.log(match);
					  if (admin_mode == true) {
					  	var file = match.substring(2, match.length-2);
					  	return ('<span class="js-landing-span" data-file="' + file + '">' + content_data[group] + '</span><textarea class="js-landing-area">' + content_data[group] + '</textarea><a href="#" class="js-landing-edit">edit</a><a href="#" class="js-landing-save">save</a>') || match;
					  }
					  else {
					  	return content_data[group] || match;
					  }
					});

					content = result;
				}
				if (admin_mode == true) {
					var auth = request.headers['authorization'];  // auth is in base64(username:password)  so we need to decode the base64
	        		console.log("Authorization Header is: ", auth);

			        if(!auth) {     // No Authorization header was passed in so it's the first time the browser hit us

		                // Sending a 401 will require authentication, we need to send the 'WWW-Authenticate' to tell them the sort of authentication to use
		                // Basic auth is quite literally the easiest and least secure, it simply gives back  base64( username + ":" + password ) from the browser
		                response.statusCode = 401;
		                response.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');

		                response.end('<html><body>Protected Admin Area.</body></html>');
			        }

			        else if(auth) {    // The Authorization was passed in so now we validate it

		                var tmp = auth.split(' ');   // Split on a space, the original auth looks like  "Basic Y2hhcmxlczoxMjM0NQ==" and we need the 2nd part

		                var buf = new Buffer(tmp[1], 'base64'); // create a buffer and tell it the data coming in is base64
		                var plain_auth = buf.toString();        // read it back out as a string

		                console.log("Decoded Authorization ", plain_auth);

		                // At this point plain_auth = "username:password"

		                var creds = plain_auth.split(':');      // split on a ':'
		                var username = creds[0];
		                var password = creds[1];

		                if((username == 'admin') && (password == 'admin')) {   // Is the username/password correct?
							response.writeHead(200, 
								{"Content-Type": type});
							content = content.replace('</body>', '<script src="service/admin.js"></script></body>');
							content = content.replace('</head>', '<link href="service/admin.css" rel="stylesheet"></head>');
							response.write(content); 
							response.end(); 
		                }
		                else {
	                        response.statusCode = 401; // Force them to retry authentication
	                        response.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');

	                        // response.statusCode = 403;   // or alternatively just reject them altogether with a 403 Forbidden

	                        response.end('<html><body>Access Denied!</body></html>');
		                }
			        }
				}
				else {
					response.writeHead(200, 
						{"Content-Type": type});
					response.write(content); 
					response.end();
				}
			}
		});
	}
});