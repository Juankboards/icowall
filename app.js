const express = require('express'),
      MongoClient = require('mongodb').MongoClient,
      app = express();
let db;


// require('dotenv').load();
MongoClient.connect(process.env.DATABASE, (err, database) => {
  if (err) return console.log(err)
  db = database;
  app.listen(process.env.PORT || 3000);
})

app.use(express.static('public'));
app.use(function(req, res, next) {  
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Credentials");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

require('./app/routes')(app);    

app.get('/*', function(req, res){
    if (req.protocol !== 'https')
      res.redirect('https://www.icowall.io')
    else
      res.sendFile(__dirname + '/public/index.html');
    }
  });