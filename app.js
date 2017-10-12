const express = require('express'),
      config = require('./config/main'),
      MongoClient = require('mongodb').MongoClient,
      app = express();
let db;



MongoClient.connect(config.database, (err, database) => {
  if (err) return console.log(err)
  db = database;
  app.listen(config.port);
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






// C3FE078186CD266D6AB12C32FC81E4CAB77EE6B36ED02EBE38099024D5686260

    // bcrypt.compare('somePassword', hash, function(err, res) {
    //   if(res) {
    //    // Passwords match
    //   } else {
    //    // Passwords don't match
    //   } 
    // });

