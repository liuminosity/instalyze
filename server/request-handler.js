var http = require("http");
var request = require("request");
var APIcode = require("./config.js");

var requestHandler = function(req, res) {
  
  console.log("Serving request type " + req.method + " for url " + req.url);

  // The outgoing status.
  var statusCode = 200;

  // See the note below about CORS headers.
  var headers = defaultCorsHeaders;

  var code = req.url.slice(7);


  headers['Content-Type'] = "text/plain";


  if (code.length === 32) {

    request.post(
      { form: { client_id: APIcode.client_id,
                client_secret: APIcode.client_secret,
                grant_type: 'authorization_code',
                redirect_uri: APIcode.redirect_uri,
                code: code
              },
        url: 'https://api.instagram.com/oauth/access_token'
      },
      function (err, response, body) {
        if (err) {
          console.log("error in Post", err)
        }else{
          console.log(JSON.parse(body))
          var userID = JSON.parse(body).user.id;
          var accessCode = JSON.parse(body).access_token;

          getUserFollowers(userID, accessCode);
        }
      }
    );
  }

  res.writeHead(statusCode, headers);

  res.end("Hello, World!");
};

// These headers will allow Cross-Origin Resource Sharing (CORS).
// This code allows this server to talk to websites that
// are on different domains, for instance, your chat client.
//
// Your chat client is running from a url like file://your/chat/client/index.html,
// which is considered a different domain.
//
// Another way to get around this restriction is to serve you chat
// client from this domain by setting up static file serving.
var defaultCorsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, accept",
  "access-control-max-age": 10 // Seconds.
};

var getUserFollowers = function(userID, accessCode) {
  var requestURL = 'https://api.instagram.com/v1/users/' + userID + '/follows?access_token=' + accessCode;
  console.log(requestURL);
  request(requestURL, function(error, res, body) {
    if (error) throw error;
    var userFollowsList = JSON.parse(body).data;
    for (var i = 0; i < userFollowsList.length; i++) {
      newRequestUrl = 'https://api.instagram.com/v1/users/' + userFollowsList[i].id + '/?access_token=' + accessCode;
      request(newRequestUrl, function(error, res, body) {
        if (error) throw error;
        console.log('this is username ' + JSON.parse(body).data.username + ' with this bio ' + JSON.parse(body).data.bio);
      })
    }

  })

  request
}

module.exports = requestHandler;

