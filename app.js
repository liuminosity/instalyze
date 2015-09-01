var app = {
  // userID: '1800057729',
  // accessToken: '1800057729.8843d5c.fa8eca5e374c4111a8c1aac4cfc1093f',
  // server: 'https://api.instagram.com/v1/users/' + app.userID + '/?access_token=' + app.accessToken,
  

  run: function() {
    console.log('hello');
    //if not authenticated
    app.authenticateUser();
    // var link = 'https://api.instagram.com/v1/users/' + app.userID + '/?access_token=' + app.accessToken;
    // console.log(link);
    // app.test(link);
  },
  // username: 'liuminosity_',
  // server: '127.0.0.1',
  // server: 'https://api.instagram.com/v1/users/1800057729/?access_token=1800057729.8843d5c.fa8eca5e374c4111a8c1aac4cfc1093f',
  test: function(link) {
    $.ajax({
      url: link,
      type: 'GET',
      dataType: "jsonp",
      success: function(data) {
        console.log('get info');
        console.log(data);
      },
      error: function(data) {
        console.log('error, no data sent/got');
        console.log(data);
      }
    })
  },

  authenticateUser: function() {


    $.ajax({
      url: 'https://instagram.com/oauth/authorize/?client_id=8843d5c662294d3297746ccccac09f8c&redirect_uri=http://localhost&response_type=token',
      type: "GET",
      dataType: "jsonp",
      success: function(data) {
        console.log('yay');
      },
      error: function(data) {
        console.log('nope');
      }

    });
    // var auth = function() {
    //   window.location = 'https://instagram.com/oauth/authorize/?client_id=8843d5c662294d3297746ccccac09f8c&redirect_uri=http://localhost&response_type=token';
    // }
    // var getURL = function(cb) {
    //   console.log(window.location.href);
    // }
    // getURL(auth());

    app.userID = '1800057729';
    accessToken = '1800057729.8843d5c.fa8eca5e374c4111a8c1aac4cfc1093f';
  }

}