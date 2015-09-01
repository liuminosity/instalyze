var http = require("http");
var request = require("request");
var APIcode = require("./config.js");
var MAX_PER_USER = 5;
var counter;
var userInput = 'and';
var db = require('./db');

var requestHandler = function(req, res) {
  
  console.log("Serving request type " + req.method + " for url " + req.url);

  // The outgoing status.
  var statusCode = 200;

  // See the note below about CORS headers.
  var headers = defaultCorsHeaders;

  var code = req.url.slice(7);

  // db.query('select * from profiles', function(err, results) {
  //   if (err) throw error;
  //   console.log(results);
  // })
  headers['Content-Type'] = "text/plain";

  //check users
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
          var parsedBody = JSON.parse(body);
          var userID = parsedBody.user.id;
          var accessCode = parsedBody.access_token;
          var innerString = '("' +
                            parsedBody.user.id + '", "' +
                            parsedBody.user.username + '", "' +
                            parsedBody.user.full_name + '", "' +
                            parsedBody.user.profile_picture + '", "' +
                            parsedBody.user.bio + '");';
          var queryString = "insert into profiles " + 
            "(userid, username, full_name, profile_picture, bio) values " + innerString;
          console.log(queryString);
          db.query(queryString, function(err, results) {
            if (err && err.code !== 'ER_DUP_ENTRY') {
              throw err;
            }
            counter = 0;
            getUserFollowers(userID, accessCode);
          })

          
        }
      }
    );
  }

  res.writeHead(statusCode, headers);

  res.end("Hello, World!");
};

var defaultCorsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, accept",
  "access-control-max-age": 10 // Seconds.
};

var getUserFollowers = function(userID, accessCode) {
  var requestURL = 'https://api.instagram.com/v1/users/' + userID + '/follows?access_token=' + accessCode;
  //console.log(requestURL);
  console.log('running getUserFollowers');
  request(requestURL, function(error, res, body) {
    if (error) throw error;
    counter++;
    console.log('tis is counter ' + counter);
    if (counter >MAX_PER_USER) {
      console.log('*************DONE**************');
      return;
    };
    var userFollowsList = JSON.parse(body).data;
    
    for (var i = 0; i < userFollowsList.length; i++) {
      // var checkForDuplicateQuery = "select * from profiles where userid=" + userFollowsList[i].id;
      // db.query(checkForDuplicateQuery, function(error, res, body) {
      //   if (error && error.code !== 'ER_DUP_ENTRY') {
      //     throw error;
      //   }
      //   console.log('THIS IS BODY ' + JSON.stringify(body));
      // })
      newRequestUrl = 'https://api.instagram.com/v1/users/' + userFollowsList[i].id + '/?access_token=' + accessCode;
      if (counter >MAX_PER_USER) {
        console.log('*************DONE**************');
        return;
      }
      counter++;
      request(newRequestUrl, function(error, res, body) {
        if (error) throw error;
        var parsedBody = JSON.parse(body);
        if (parsedBody.data === undefined) return;
        var innerString = '("' +
                          parsedBody.data.id + '", "' +
                          parsedBody.data.username + '", "' +
                          parsedBody.data.full_name + '", "' +
                          parsedBody.data.profile_picture + '", "' +
                          db.escape(parsedBody.data.bio).replace(/"/g, '\'') + '", "' +
                          parsedBody.data.counts.media + '", "' +
                          parsedBody.data.counts.follows + '", "' +
                          parsedBody.data.counts.followed_by + '");';
        var queryString = "insert into profiles " + "(userid, username, full_name, profile_picture, bio, media_count, follows, followers) values " + innerString;
        //console.log('********* this is the new queryString: ' + queryString);
        db.query(queryString, function(err, results) {
          if (err && err.code !== 'ER_DUP_ENTRY') {
            console.log('*******ERROR!!!******* ' + err);
            console.log('*******for user: ' + parsedBody.data.username + ' and bio: ' + parsedBody.data.bio);
          }
      

          counter++;
          if (counter >MAX_PER_USER) {
            console.log('*************DONE**************');
            return;
          };
          getUserFollowers(parsedBody.data.id, accessCode);
          // console.log('this is username ' + parsedBody.data.username + ' with this bio ' + parsedBody.data.bio);
          // if (checkForString(parsedBody.data.bio.toLowerCase(), userInput.toLowerCase())) {
            // console.log('found string ' + userInput + ' in ' + parsedBody.data.bio);
          // };
          
        })

        
        
        //console.log('this is the number of calls: ' + counter);
      })
    }
    
  })

}

var checkForString = function(string, userInput) {
  var subString = new RegExp(userInput);
  // console.log(string, userInput);
  return subString.test(string);
}

module.exports = requestHandler;

