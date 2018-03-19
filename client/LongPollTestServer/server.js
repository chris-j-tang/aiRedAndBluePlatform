const express = require('express');
const app = express();

app.route('/listen')
  .get(function (req,res) {
    setTimeout(function(){
      res.status(201).send('hello');
      console.log('sending hello');
    }, Math.random() * 5000 + 3000);
    // }, 1000);
  });

var server = app.listen(4039, function() {
  var port = server.address().port;
  console.log('Server listening on port ' + port);
});
