const express = require('express'),
    bodyParser= require('body-parser'),
    fs= require('fs'),
    bcrypt = require('bcrypt'),
    jwt = require('jsonwebtoken'),
    cookieParser = require('cookie-parser'),
    passport = require("passport"),
    aws = require('aws-sdk'),
    crypto = require('crypto');
    MongoClient = require('mongodb').MongoClient;


    let db;

    // require('dotenv').load();

    MongoClient.connect(process.env.DATABASE, (err, database) => {
      if (err) return console.log(err)
      db = database;
    })

module.exports = function(app) {  


  app.use(passport.initialize());
  app.use(bodyParser.json({limit: '2mb'}));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.get('/', function (req, res) {
    res.render('index');
  });

  app.get("/emailconfirmation", function (req, res) {
    res.render('index');
  });

  require('../config/passport')(passport);
  const apiRoutes = express.Router();

  apiRoutes.post('/register', (req, res) => {
    const userInfo = req.body;
    userInfo.unconfirmed = crypto.randomBytes(20).toString('hex');
    userInfo.recover = "";
    userInfo.created = Date.now()
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

  apiRoutes.get('/getapprovedicons', (req, res) => {
    db.collection("icons").find({approved: true}).toArray(function (err, result) {
      if (err) throw err
      if (result.length > 0){
        res.status(200).json({"icons": result});
      } else{
        res.status(400).json({"message": "Unable to get Icons"});
      }  
    })  
  });

  apiRoutes.get('/getallicons', (req, res) => {
    db.collection("icons").find().toArray(function (err, result) {
      if (err) throw err
      if (result.length > 0){
        res.status(200).json({"icons": result});
      } else{
        res.status(400).json({"message": "Unable to get Icons"});
      }  
    })  
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

  apiRoutes.post("/upload", passport.authenticate('jwt', { session: false }), function (req, res) {
      const icon = {
        "name": req.body.name,
        "description": req.body.description,
        "web": req.body.web,
        "date": req.body.date,
        "columnSize": req.body.columnSize,
        "rowSize": req.body.rowSize,
        "columns": req.body.columns,
        "rows": req.body.rows,
        "approved": false,
        "userId": req.user._id
      };

      

      const dataUri = req.body.image;      
      const imageBuffer = new Buffer(dataUri.split(",")[1], "base64");
      aws.config.region = process.env.AWS_REGION;
      aws.config.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
      aws.config.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

      
      // icon.filename = filename;
      const s3 = new aws.S3();
      const filename = "icon_" + Date.now() + "_" + Math.random().toString().split(".")[1];
      const type = dataUri.split(";")[0].split("/")[1];
      icon.filename = "https://s3.amazonaws.com/" + process.env.S3_BUCKET_NAME +"/" + filename;
      icon.type = type;
      const s3Params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: filename,
        Body: imageBuffer,
        ContentEncoding: 'base64',
        ContentType: "image/"+type,
        ACL: 'public-read'
      };

      s3.putObject(s3Params, function(err, data){
          if (err) {  
            res.status(500).json({message: err});
          } else {
            console.log('succesfully uploaded the image!');
            db.collection('icons').save(icon, (err, result) => {
              if (err) {
                res.status(500).json({message: err});
              } else {
                res.status(200).json({message: "Icon stored. You will recieve an email to confirm your purchase"});
              }
            })
          }
      });
  });

  apiRoutes.post("/login", function(req, res) {
    const username = req.body.username;
    const password = req.body.password;
    
    const query = {};
    query["username"] = username;
    db.collection("users").findOne(query, function(err, user){
      if( !user ){
        res.status(401).json({message:"no such user found"});
        return;
      }

      if(user.unconfirmed){
        res.status(401).json({message:"You need to confirm your email to Login"});
        return;
      }
      
      bcrypt.compare(password, user.password, function(err, match) {
        if(match) {
          var payload = {id: user._id};
          var token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: 10080 });
          res.cookie('jwt', token, { maxAge: 260000000, httpOnly: true });
          res.json({token: 'JWT ' + token});
        } else{
         res.status(401).json({message:"passwords did not match"});
        }
      });
    });
  });

  apiRoutes.put("/emailconfirmation", function(req, res) {
    const query = {unconfirmed: req.query.id};
    db.collection("users").findAndModify({
      query: query,
      sort: { created: 1 },
      update: { $unset: {unconfirmed: "" }}
    }, function(err, user){
      if( !user ){
        res.status(401).json({message:"Invalid link"});
        return;
      }
    });
  });

  apiRoutes.get('/logged', passport.authenticate('jwt', { session: false }), function(req, res) {
    res.status(200).json({"message": 'logged'+Date(), "user": req.user});
  });

  apiRoutes.get('/signout', passport.authenticate('jwt', { session: false }), function(req, res) {
    res.cookie('jwt', "", { maxAge: 0, httpOnly: true });
    res.status(200).json({"message": 'signout'});
  });




  app.use('/api', apiRoutes); 
}