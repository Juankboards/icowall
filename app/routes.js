const express = require('express'),
    config = require('../config/main'),  
    bodyParser= require('body-parser'),
    fs= require('fs'),
    bcrypt = require('bcrypt'),
    jwt = require('jsonwebtoken'),
    cookieParser = require('cookie-parser'),
    passport = require("passport");

module.exports = function(app) {  

  app.use(passport.initialize());
  app.use(bodyParser.json({limit: '2mb'}));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.get('/', function (req, res) {
    res.render('index');
  })

  require('../config/passport')(passport);

  const apiRoutes = express.Router();

  app.post('/register', (req, res) => {
    const userInfo = req.body;
    bcrypt.hash(req.body.password, 10, function(err, hash) {
      userInfo.password = hash;
      db.collection('users').save(userInfo, (err, result) => {
        if (err) {
          res.status(500).json({message: err});
        } else {
          res.status(200).json({message: "Account created. You will recieve an email to confirm your account"});
        }
      })  
    });
  });

  apiRoutes.post('/uniqueness', (req, res) => {
    const query = {};
    const parameter = req.body.parameter;
    const value = req.body.value;
    query[parameter] = value;
    db.collection("users").find(query).toArray(function (err, result) {
      if (err) throw err
      if (result.length > 0){
        res.status(400).json({message: req.body.parameter + " already used"});
      } else{
        res.status(200).json({message: req.body.parameter + " available"});
      }  
    })  
  });

  apiRoutes.post("/upload", function (req, res) {
      const icon = {
        "name": req.body.name,
        "description": req.body.description,
        "web": req.body.web,
        "columnSize": req.body.columnSize,
        "rowSize": req.body.rowSize,
        "columns": req.body.columns,
        "rows": req.body.rows
      }
      const dataUri = req.body.image;
      const type = dataUri.split(";")[0].split("/")[1];
      const imageBuffer = new Buffer(dataUri.split(",")[1], "base64");
      const filename = "icon_" + Date.now() + "_" + Math.random().toString().split(".")[1] + "." + type;
      icon.filename = filename;
      fs.writeFile("../public/uploads/" + filename, imageBuffer, (err) => {
      if (err) throw err;
      db.collection('icons').save(icon, (err, result) => {
        if (err) {
          res.status(500).json({message: err});
        } else {
          res.status(200).json({message: "Icon stored. You will recieve an email to confirm your purchase"});
        }
      })
      });

  });

  apiRoutes.post("/login", function(req, res) {
    console.log('Cookies: ', req.cookies)
    console.log('Signed Cookies: ', req.signedCookies)
    const username = req.body.username;
    const password = req.body.password;
    
    var user = users.find((user) => user.username == username);
    if( !user ){
      res.status(401).json({message:"no such user found"});
      return;
    }

    if(user.password === req.body.password) {
      var payload = {id: user.id};
      var token = jwt.sign(payload, config.secret, { expiresIn: 10080 });
      res.cookie('jwt', token, { maxAge: 10080});
      res.json({token: 'JWT ' + token});
    } else {
      res.status(401).json({message:"passwords did not match"});
    }
  });

  apiRoutes.get('/dashboard', passport.authenticate('jwt', { session: false }), function(req, res) {
    res.status(200).json({"message": 'It worked! User id is: ' + req.user._id + '.'});
  });


  app.use('/api', apiRoutes);  

  const users = [
    {
      id: 1,
      username: 'jonathanmh',
      password: '%2yx4'
    },
    {
      id: 2,
      username: 'test',
      password: 'test'
    }
  ];
}