var http = require("http");
var request = require("request");
var APIcode = require("./config.js");
var MAX_PER_USER = 30;
var counter;
var userInput = 'and';
var db = require('./server/db');
var express = require("express");
var app = express();
// var randomAccount = Math.floor(Math.random(1,2147483647));
var randomAccount;

var loginURL = 'https://instagram.com/oauth/authorize/?client_id=8843d5c662294d3297746ccccac09f8c&redirect_uri=http://127.0.0.1:3000&response_type=code'

var userAuthenticated = false;

app.get('/search', function(req, res) {
  console.log("Serving request type " + req.method + " for url " + req.url);
  var inquiry = req.url.slice(19).split('/');
  var searchWords = inquiry[0];
  var min = inquiry[1];
  var queryString = "select userid, full_name, username, bio, media_count, follows, followers from profiles " 
  + "where bio like '%" + searchWords + "%' "
  + "and followers > " + min + ";";
  console.log('this is queryString ' + queryString);
  db.query(queryString, function(error, response) {
    if (error) throw error;
    res.send(response);
  })
})

app.get('/', function(req,res) {
  if (!userAuthenticated) {
    userAuthenticated = true;
    res.redirect(loginURL);
  }
  console.log('user authenticated');
  console.log("Serving request type " + req.method + " for url " + req.url);
  // var statusCode = 200;
  // var headers = defaultCorsHeaders;
  // headers['Content-Type'] = "text/plain";

  var code = req.url.slice(7);
  //console.log('this is code: ' + code);
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
          console.log('this is body: ' + JSON.stringify(parsedBody));
          
          var userID = parsedBody.user.id;
          if (userID === undefined) return;
          var accessCode = parsedBody.access_token;
          var queryString = "select 1 from profiles where userid="+userID;
          db.query(queryString, function(error, res) {
            if (error && error.code !== 'ER_DUP_ENTRY') {
              throw error;
            }
            if (JSON.stringify(res) === '[]') {
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

            } else {
              //user already exists in database
              counter = 0;
              // randomAccount = Math.floor(Math.random() * 2547483647) + 1;


              randomAccount = 54174342;

              console.log('user exists, searching random account number ' + randomAccount);

              
              request('https://api.instagram.com/v1/users/' + randomAccount, function(error, res, body) {
                console.log(JSON.parse(body).meta.code);
                if (JSON.parse(body).meta.code === '400') {
                  randomAccount = Math.floor(Math.random() * 2147483647) + 1;
                  console.log('this is the new seed ' + randomAccount);
                  getUserFollowers(randomAccount, accessCode);
                } else { 
                  console.log('going in');
                  getUserFollowers(randomAccount, accessCode);
                }
              })
              
              

              
            }


          })
        }
      }
    );
  }

  // res.writeHead(statusCode, headers);

  res.sendFile(__dirname +'/index.html');
})

// var requestHandler = function(req, res) {
  
//   console.log("Serving request type " + req.method + " for url " + req.url);

//   // The outgoing status.
//   var statusCode = 200;

//   // See the note below about CORS headers.
//   var headers = defaultCorsHeaders;

  
//   // if (!userAuthenticated) {
//   //   console.log('user is not authenticated!');
//   //   userAuthenticated = true;
//   //   res.writeHead(302, {'Location': 'https://instagram.com/oauth/authorize/?client_id=8843d5c662294d3297746ccccac09f8c&redirect_uri=http://127.0.0.1:3000&response_type=code'});
//   //   res.end();
//   // }


//   headers['Content-Type'] = "text/plain";

//   //check users


//   var code = req.url.slice(7);
//   if (code.length === 32) {

//     request.post(
//       { form: { client_id: APIcode.client_id,
//                 client_secret: APIcode.client_secret,
//                 grant_type: 'authorization_code',
//                 redirect_uri: APIcode.redirect_uri,
//                 code: code
//               },
//         url: 'https://api.instagram.com/oauth/access_token'
//       },
//       function (err, response, body) {
//         if (err) {
//           console.log("error in Post", err)
//         }else{
//           var parsedBody = JSON.parse(body);
//           var userID = parsedBody.user.id;
//           var accessCode = parsedBody.access_token;
//           var innerString = '("' +
//                             parsedBody.user.id + '", "' +
//                             parsedBody.user.username + '", "' +
//                             parsedBody.user.full_name + '", "' +
//                             parsedBody.user.profile_picture + '", "' +
//                             parsedBody.user.bio + '");';
//           var queryString = "insert into profiles " + 
//             "(userid, username, full_name, profile_picture, bio) values " + innerString;
//           console.log(queryString);
//           db.query(queryString, function(err, results) {
//             if (err && err.code !== 'ER_DUP_ENTRY') {
//               throw err;
//             }
//             counter = 0;
//             getUserFollowers(userID, accessCode);
//           })

          
//         }
//       }
//     );
//   }

//   res.writeHead(statusCode, headers);

//   res.end("Hello, World!");
// };

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
    console.log(userFollowsList);
    if (userFollowsList === undefined) {
      console.log('breaking');
      return;
    }
    for (var i = 0; i < userFollowsList.length; i++) {
      var checkForDuplicateQuery = "select 1 from profiles where userid=" + userFollowsList[i].id;
      checkForDuplicates(i, checkForDuplicateQuery, userFollowsList, counter, accessCode)
            
    }
    
  })

}

var checkForString = function(string, userInput) {
  var subString = new RegExp(userInput);
  // console.log(string, userInput);
  return subString.test(string);
}

var checkForDuplicates = function(index, queryString, userFollowsList, counter, accessCode) {
  console.log('running checkForDuplicates');
  db.query(queryString, function(error, res) {
    if (error && error.code !== 'ER_DUP_ENTRY') {
      throw error;
    }

    if (JSON.stringify(res) === '[]') {
      console.log('does not exist');
      newRequestUrl = 'https://api.instagram.com/v1/users/' + userFollowsList[index].id + '/?access_token=' + accessCode;
      if (counter >MAX_PER_USER) {
        console.log('*************DONE**************');
        return;
      }
      counter++;
      console.log('tis is counter ' + counter);
      request(newRequestUrl, function(error, res, body) {
        console.log('****REQUEST RAN!*****');
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
          console.log('tis is counter ' + counter);
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

app.listen(3000);

// module.exports = requestHandler;

