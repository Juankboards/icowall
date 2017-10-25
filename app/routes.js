const express = require('express'),
    bodyParser= require('body-parser'),
    fs= require('fs'),
    bcrypt = require('bcrypt'),
    jwt = require('jsonwebtoken'),
    cookieParser = require('cookie-parser'),
    passport = require("passport"),
    aws = require('aws-sdk'),
    crypto = require('crypto'),
    mailgun = require('mailgun-js')({apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN});
    MongoClient = require('mongodb').MongoClient;

    let db;

    // require('dotenv').load();

    MongoClient.connect(process.env.DATABASE, (err, database) => {
      if (err) return console.log(err)
      db = database;
    })

module.exports = function(app) {  


  app.use(passport.initialize());
  app.use(bodyParser.json({limit: '100mb'}));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cookieParser());

  require('../config/passport')(passport);
  const apiRoutes = express.Router();
  app.use('/api', apiRoutes); 

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
          const mailInfo = {
            from: 'IcoWall <info@icowall.io>',
            to: userInfo.email,
            subject: 'IcoWall Email verification',
            text: 'Welcome to IcoWall!\n\nVerify your email, click the link below\nhttp://icowall.io/emailverification?id='+userInfo.unconfirmed,
            html: '<html><div style="background-color: #323a4d;width: 80%;max-width: 750px; padding: 25px; font-family: \'Jura\', sans-serif;">\
            <div style="margin: 0 auto;text-align: center;"><a style="text-decoration: none;color: #fff" href="http://icowal.io">\
            <img style="width: 200px" src="http://s3.amazonaws.com/icowall/icon.png"><p style="font-size: 1.03em;text-align: center;margin: 0 0 0 5px;">The ICO\'s hall of fame</p>\
            </a></div><div style="margin: 45px auto 0px auto;"><h2 style="color: #fff;">Welcome to IcoWall!</h2><p style="color: #fff">Verify your email, click the link below</p>\
            <a style="color: #fff; word-wrap: break-word;" href="http://icowall.io/emailverification?id='+userInfo.unconfirmed+'">\
            http://icowall.io/emailverification?id='+userInfo.unconfirmed+'</a></div></div></html>'
          };

          mailgun.messages().send(mailInfo, function (error, body) {
            if(error){console.log(error)}
          });
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
                const mailInfo = {
                  from: 'IcoWall <info@icowall.io>',
                  to: req.user.email,
                  subject: 'IcoWall Blocks reservation',
                  text: 'Thanks for reserve on IcoWall!\nMake the payment to #############\nWhen we verify the payment your icon will be available on IcoWall to the public',
                  html: '<html><div style="background-color: #323a4d;width: 80%;max-width: 750px; padding: 25px; font-family: \'Jura\', sans-serif;">\
                        <div style="margin: 0 auto;text-align: center;"><a style="text-decoration: none;color: #fff" href="http://icowal.io">\
                        <img style="width: 200px" src="http://s3.amazonaws.com/icowall/icon.png"><p style="font-size: 1.03em;text-align: center;margin: 0 0 0 5px;">The ICO\'s hall of fame</p>\
                        </a></div><div style="margin: 45px auto 0px auto;"><h2 style="color: #fff;">Thanks for reserve on IcoWall!</h2>\
                        <p style="color: #fff">Make the payment to #############<br>When we verify the payment your icon will be available on IcoWall to the public</p>\
                        </div></div></html>'
                };
                mailgun.messages().send(mailInfo, function (error, body) {
                  if(error){console.log(error)}
                });
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
        res.status(402).json({message:"You need to confirm your email to Login"});
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

  apiRoutes.get("/resendVerificationEmail", function(req, res) {
    if(!req.query.username){
      res.status(400).json({message: "Invalid request"});
      return;
    }
    const query = {username: req.query.username};
    db.collection("users").findOne(query, function(err, user){
      console.log(user)
      if(user){
        const mailInfo = {
            from: 'IcoWall <info@icowall.io>',
            to: user.email,
            subject: 'IcoWall Email verification',
            text: 'Welcome to IcoWall!\n\nVerify your email, click the link below\nhttp://icowall.io/emailverification?id='+user.unconfirmed,
            html: '<html><div style="background-color: #323a4d;width: 80%;max-width: 750px; padding: 25px; font-family: \'Jura\', sans-serif;">\
            <div style="margin: 0 auto;text-align: center;"><a style="text-decoration: none;color: #fff" href="http://icowal.io">\
            <img style="width: 200px" src="http://s3.amazonaws.com/icowall/icon.png"><p style="font-size: 1.03em;text-align: center;margin: 0 0 0 5px;">The ICO\'s hall of fame</p>\
            </a></div><div style="margin: 45px auto 0px auto;"><h2 style="color: #fff;">Welcome to IcoWall!</h2><p style="color: #fff">Verify your email, click the link below</p>\
            <a style="color: #fff; word-wrap: break-word;" href="http://icowall.io/emailverification?id='+user.unconfirmed+'">\
            http://icowall.io/emailverification?id='+user.unconfirmed+'</a></div></div></html>'
          };
          mailgun.messages().send(mailInfo, function (error, body) {
            if(error){
              res.status(408).json({message:"Error sending the email"}); 
              return;
            }
          });
          res.status(200).json({message:"Email confirmed"});
      }else{
        res.status(401).json({message:"Invalid link"});
      }
    });
  });

  apiRoutes.put("/emailverification", function(req, res) {
    const query = req.query.id;
    if(!query){
      res.status(400).json({message: "Invalid link"});
      return;
    }
    db.collection("users").findAndModify(
      {unconfirmed: query},
      [],
      { $unset: {unconfirmed: "" }},
      { new: false },
     function(err, user){
      if(user.value){
        res.status(200).json({message:"Email confirmed"});
      }else{
        res.status(401).json({message:"Invalid link"});
      }
    });
  });

  apiRoutes.get("/passwordrecovery", function(req, res) {   
    const query = req.query.id;
    console.log(query)
    if(!query){
      res.status(400).json({message: "Invalid link"});
      return;
    }
    db.collection("users").findOne({recover: query}, function (err, result) {
      if (result){
        res.status(200).json({message: "Valid link"});
      } else{
        res.status(400).json({message: "Invalid link"});
      }  
    })  
  });


  apiRoutes.post("/passwordreset", function(req, res) {   
    const query = req.query.id;
    console.log(query)
    if(!query){
      res.status(400).json({message: "Invalid link"});
      return;
    }
    bcrypt.hash(req.body.password, 10, function(err, hash) {
      db.collection("users").findAndModify(
        {recover: query},
        [],
        { $set: {recover: "", password: hash}},
        { new: false },
       function(err, user){
        console.log(user)
        if(user.value){
          res.status(200).json({message:"Email confirmed"});
        }else{
          res.status(401).json({message:"Invalid link"});
        }
      });
    });  
  });

  apiRoutes.post("/forgotpassword", function(req, res) {   
    const user_email = req.body.email;
    const recover_string = crypto.randomBytes(20).toString('hex');
    db.collection("users").findAndModify(
      {email: user_email},
      [],
      { $set: {recover: recover_string}},
      { new: false },
     function(err, user){
      console.log(user)
      if(user.value){
        const mailInfo = {
            from: 'IcoWall <info@icowall.io>',
            to: user.email,
            subject: 'IcoWall Password reset',
            text: 'Hi '+user.value.username+'!\n\nAs you have requested for reset password instructions, click the link below\nhttp://icowall.io/passwordrecovery?id='+user.value.recover,
            html: '<html><div style="background-color: #323a4d;width: 80%;max-width: 750px; padding: 25px; font-family: \'Jura\', sans-serif;">\
            <div style="margin: 0 auto;text-align: center;"><a style="text-decoration: none;color: #fff" href="http://icowal.io">\
            <img style="width: 200px" src="http://s3.amazonaws.com/icowall/icon.png"><p style="font-size: 1.03em;text-align: center;margin: 0 0 0 5px;">The ICO\'s hall of fame</p>\
            </a></div><div style="margin: 45px auto 0px auto;"><h2 style="color: #fff;">Hi '+user.value.username+'!</h2><p style="color: #fff">As you have requested for reset password instructions, click the link below</p>\
            <a style="color: #fff; word-wrap: break-word;" href="http://icowall.io/passwordrecovery?id='+user.value.recover+'">\
            http://icowall.io/passwordrecovery?id='+user.value.recover+'</a></div></div></html>'
          };
          mailgun.messages().send(mailInfo, function (error, body) {
            if(error){
              res.status(408).json({message:"Error sending the email"}); 
            }else{
              res.status(200).json({message:"Email sent"});
            }
          });
      }else{
        res.status(401).json({message:"Invalid email"});
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
}

// $2a$10$OH99v0Bt20oUVQFcx/J7CeQA2tmMzOwoyzqQe/6Y2kmM4V/.WJBkG