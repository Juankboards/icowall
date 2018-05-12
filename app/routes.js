const express = require('express'),
    bodyParser= require('body-parser'),
    fs= require('fs'),
    bcrypt = require('bcrypt'),
    jwt = require('jsonwebtoken'),
    cookieParser = require('cookie-parser'),
    passport = require("passport"),
    aws = require('aws-sdk'),
    crypto = require('crypto'),
    google = require('googleapis'),
    analyticsAuth = require('./../config/MyProject-046bd9693e92.json')
    mandrill = require('mandrill-api/mandrill'),
    mandrill_client = new mandrill.Mandrill(process.env.MANDRILL_API_KEY),
    MongoClient = require('mongodb').MongoClient,
    ObjectId = require('mongodb').ObjectID,
    getJSON = require('get-json');
    let db;

    // require('dotenv').load();

    MongoClient.connect(process.env.DATABASE, (err, database) => {
      if (err) return console.log(err)
      db = database;
    })

    let jwtClient = new google.auth.JWT(
      analyticsAuth.client_email, null, analyticsAuth.private_key,
      ['https://www.googleapis.com/auth/analytics.readonly'], null);

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
              "html": '<html><div style="background-color: #323a4d;width: 80%;max-width: 750px; padding: 25px; font-family: \'Jura\', sans-serif;">\
                      <div style="margin: 0 auto;text-align: center;"><a style="text-decoration: none;color: #fff" href="https://www.icowall.io">\
                      <img style="width: 200px" src="https://s3.amazonaws.com/icowall/icon.png"><p style="font-size: .83em;text-align: center;margin: 0 0 0 5px;">Rentable Ad Space<br>$.25 per block/week</p>\
                      </a></div><div style="margin: 45px auto 0px auto;"><h2 style="color: #fff;">Welcome to IcoWall!</h2><p style="color: #fff">Verify your email, click the link below</p>\
                      <a style="color: #fff; word-wrap: break-word;" href="https://www.icowall.io/emailverification?id='+userInfo.unconfirmed+'">\
                      https://www.icowall.io/emailverification?id='+userInfo.unconfirmed+'</a></div></div></html>',
              "text": 'Welcome to IcoWall!\n\nVerify your email, click the link below\nhttps://www.icowall.io/emailverification?id='+userInfo.unconfirmed,
              "subject": 'Email verification',
              "from_email": 'info@icowall.io',
              "from_name": "IcoWall",
              "to": [{
                      "email": userInfo.email,
                      "name": userInfo.username,
                      "type": "to"
                  }],
              "important": false,
              "track_clicks": true
          };
          var async = false;
          mandrill_client.messages.send({message: mailInfo, "async": async}, function(result) {
              console.log(result);
          }, function(e) {
              // Mandrill returns the error as an object with name and message keys
              console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
              // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
          });
          res.status(200).json({message: "Account created. You will recieve an email to confirm your account"});
        }
      })  
    });
  });

  apiRoutes.get('/getapprovedicons', (req, res) => {
    db.collection("icons").find({approved: true}).sort({totalBlocks: -1}).toArray(function (err, result) {
      if (err) throw err
      if (result.length > 0){
        res.status(200).json({message: result});
      } else{
        res.status(400).json({message: "Unable to get Icons"});
      }  
    })  
  });

  apiRoutes.get('/getUniqueUsers', (req, res) => {
    jwtClient.authorize(function (err, tokens) {
      if (err) {
        res.status(400).json({message: "Error accesing Google Analitics"});
        return;
      }
      let analytics = google.analytics('v3');
      analytics.data.ga.get({
        'auth': jwtClient,
        'ids': process.env.ANALYTICS_VIEW_ID,
        'metrics': 'ga:users',
        'start-date': '1daysAgo',
        'end-date': 'today',
      }, function (err, response) {
        if (err) {
          console.log(err);
          return;
        }
        res.status(200).json({message: response.rows[0][0]});
      }); 
    });
  });

  apiRoutes.get('/getIcon', (req, res) => {
    const id = ObjectId(req.query.id);
    const query = {};
    query["_id"] = id;
    db.collection("icons").findOne(query, function(err, icon){
      if (err) throw err
      if(icon){
        res.status(200).json({"icon": icon});
      } else{
        res.status(400).json({"message": "Invalid ID"});
      }  
    })  
  });

  apiRoutes.get('/getallicons', (req, res) => {
    db.collection("icons").find().toArray(function (err, result) {
      if (err) throw err
      if (result.length > 0){
        res.status(200).json({message: result});
      } else{
        res.status(400).json({message: "Unable to get Icons"});
      }  
    })  
  });

  apiRoutes.get('/userblocks', passport.authenticate('jwt', { session: false }), (req, res) => {
    const id = req.user._id;
    db.collection("icons").find({"userId": id}).toArray(function (err, result) {
      if (err) throw err
      if (result.length > 0){
        res.status(200).json({message: result});
      } else{
        res.status(400).json({message: id});
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

  apiRoutes.post('/contactmessage', (req, res) => {
    const mailInfo = {
      "text": 'email: '+req.body.email+'\nmessage: '+req.body.message,
      "subject": req.body.subject,
      "from_email": 'info@icowall.io',
      "from_name": "IcoWall",
      "to": [{
              "email": "support@icowall.io",
              "name": "Support",
              "type": "to"
          }],
      "important": false,
      "track_clicks": true
    };
    var async = false;
    mandrill_client.messages.send({"message": mailInfo, "async": async}, function(result) {
        console.log(result);
    }, function(e) {
        // Mandrill returns the error as an object with name and message keys
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
    });
    res.redirect("/");
  });

  apiRoutes.get("/blockcost", passport.authenticate('jwt', { session: false }), function (req, res) {
    getCost().then((cost) => {
      if(!cost.btc || !cost.eth){
          res.status(404).json({message: "Block price unavailable, try in a moment"});
      }else{
        res.status(200).json({message: cost});
      } 
    });
  });

  function getCostInBTC() {
    return new Promise((resolve,reject) => {
      let cost = 0;
      getJSON('https://api.coinmarketcap.com/v1/ticker/bitcoin/', function(error, response){ 
        if(error){
          reject(error)
        }else{
          cost = parseFloat((process.env.BLOCK_COST/parseFloat(response[0].price_usd) + 0.00000001).toFixed(8));  
          resolve(cost);    
        } 
      })
    })
  }

  function getCostInETH() {
    return new Promise((resolve,reject) => {
      let cost = 0;
      getJSON('https://api.coinmarketcap.com/v1/ticker/ethereum/', function(error, response){ 
        if(error){
          reject(error)
        }else{
          cost = parseFloat((process.env.BLOCK_COST/parseFloat(response[0].price_usd) + 0.00000001).toFixed(8));  
          resolve(cost);    
        } 
      })
    })
  }

  function getCost() {
    return new Promise((resolve,reject) => {
      const cost = {"btc": 0, "eth": 0};
      getCostInBTC().then((btcCost) => {
        cost.btc = btcCost;        
        getCostInETH().then((ethCost) => {
          cost.eth = ethCost;
          resolve(cost);  
        });
      });  
    })
  }


  apiRoutes.post("/upload", passport.authenticate('jwt', { session: false }), function (req, res) {
    getCost().then((cost) => {
      const blockCostBtc = cost.btc;
      const blockCostEth = cost.eth;
      const icon = {
        "name": req.body.name,
        "description": req.body.description,
        "web": req.body.web,
        "date": req.body.date,
        "dateFinish": req.body.dateFinish,
        "columnSize": req.body.columnSize,
        "rowSize": req.body.rowSize,
        "totalBlocks": parseInt(req.body.columnSize)*parseInt(req.body.rowSize),
        "columns": req.body.columns,
        "rows": req.body.rows,
        "period": req.body.period,
        "cost_btc": parseInt(req.body.period)*parseInt(req.body.columnSize)*parseInt(req.body.rowSize)*blockCostBtc,
        "cost_eth": parseInt(req.body.period)*parseInt(req.body.columnSize)*parseInt(req.body.rowSize)*blockCostEth,
        "approved": false,
        "userId": req.user._id,
        "username": req.user.username,
        "social": {
          "facebook": req.body.facebook,
          "twitter": req.body.twitter,
          "github": req.body.github,
          "telegram": req.body.telegram,
          "bitcoin": req.body.bitcoin,
          "reddit": req.body.reddit,
          "slack": req.body.slack
        }
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
                    "html": '<html><div style="background-color: #323a4d;width: 80%;max-width: 750px; padding: 25px; font-family: \'Jura\', sans-serif;">\
                                        <div style="margin: 0 auto;text-align: center;"><a style="text-decoration: none;color: #fff" href="https://www.icowall.io">\
                                        <img style="width: 200px" src="https://s3.amazonaws.com/icowall/icon.png"><p style="font-size: .83em;text-align: center;margin: 0 0 0 5px;">Rentable Ad Space<br>$.25 per block/week</p>\
                                        </a></div><div style="margin: 45px auto 0px auto;"><h2 style="color: #fff;">Thank you for reserving your space on IcoWall!</h2>\
                                        <p style="color: #fff">Please make a payment of<br>'+ icon.cost_btc +'BTC to 1MLhuxruKiy2s2qK6iVjTkRpaPzhjmkGvAc g<br>or<br>'+ icon.cost_eth +'ETH to 0xa9b774Db2C919484DC4bC26604a1fEb6EdD41af2<br>When we verify the payment your icon will be available on IcoWall to the public.<br>\
                                        Our experienced team also offers full end to end ICO advisory and marketing. Please contact info@icowall.io for information and pricing.</p>\
                                        </div></div></html>',
                    "text": 'Thank you for reserving your space on IcoWall!\nMake the payment of '+ icon.cost +' BTC to 1MLhuxruKiy2s2qK6iVjTkRpaPzhjmkGvA or '+ icon.cost_eth +' ETH to 0xa9b774Db2C919484DC4bC26604a1fEb6EdD41af2 \nWhen we verify the payment your icon will be available on IcoWall to the public',
                    "subject": 'Block Reservation',
                    "from_email": 'info@icowall.io',
                    "from_name": "IcoWall",
                    "to": [{
                            "email": req.user.email,
                            "name": req.user.username,
                            "type": "to"
                        }],
                    "important": false,
                    "track_clicks": true
                };
                var async = false;
                mandrill_client.messages.send({"message": mailInfo, "async": async}, function(result) {
                    console.log(result);
                }, function(e) {
                    // Mandrill returns the error as an object with name and message keys
                    console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
                    // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
                });
                const reservationInfo = {
                    "text": 'Blocks reservation:\n' + JSON.stringify(icon),
                    "subject": 'Block Reservation',
                    "from_email": 'info@icowall.io',
                    "from_name": "IcoWall",
                    "to": [{
                            "email": "info@icowall.io",
                            "name": "Support",
                            "type": "to"
                        }],
                    "important": false,
                    "track_clicks": true
                };
                var async = false;
                mandrill_client.messages.send({"message": reservationInfo, "async": async}, function(result) {
                    console.log(result);
                }, function(e) {
                    // Mandrill returns the error as an object with name and message keys
                    console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
                    // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
                });
                res.status(200).json({message: "Icon stored. You will recieve an email to confirm your purchase"});
              }
            })
          }
      });
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
          var payload = {username: user.username};
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
            "html": '<html><div style="background-color: #323a4d;width: 80%;max-width: 750px; padding: 25px; font-family: \'Jura\', sans-serif;">\
                    <div style="margin: 0 auto;text-align: center;"><a style="text-decoration: none;color: #fff" href="https://icowall.io">\
                    <img style="width: 200px" src="https://s3.amazonaws.com/icowall/icon.png"><p style="font-size: .83em;text-align: center;margin: 0 0 0 5px;">Rentable Ad Space<br>$.25 per block/week</p>\
                    </a></div><div style="margin: 45px auto 0px auto;"><h2 style="color: #fff;">Welcome to IcoWall!</h2><p style="color: #fff">Verify your email, click the link below</p>\
                    <a style="color: #fff; word-wrap: break-word;" href="https://www.icowall.io/emailverification?id='+user.unconfirmed+'">\
                    https://www.icowall.io/emailverification?id='+user.unconfirmed+'</a></div></div></html>',
            "text": 'Welcome to IcoWall!\n\nVerify your email, click the link below\nhttps://www.icowall.io/emailverification?id='+user.unconfirmed,
            "subject": 'Email verification',
            "from_email": 'info@icowall.io',
            "from_name": "IcoWall",
            "to": [{
                    "email": user.email,
                    "name": user.username,
                    "type": "to"
                }],
            "important": false,
            "track_clicks": true
        };
        var async = false;
        mandrill_client.messages.send({"message": mailInfo, "async": async}, function(result) {
            console.log(result);
        }, function(e) {
            // Mandrill returns the error as an object with name and message keys
            console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
            // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
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
          res.status(200).json({message:"Password changed successfully"});
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
            "html": '<html><div style="background-color: #323a4d;width: 80%;max-width: 750px; padding: 25px; font-family: \'Jura\', sans-serif;">\
                    <div style="margin: 0 auto;text-align: center;"><a style="text-decoration: none;color: #fff" href="https://icowall.io">\
                    <img style="width: 200px" src="https://s3.amazonaws.com/icowall/icon.png"><p style="font-size: .83em;text-align: center;margin: 0 0 0 5px;">Rentable Ad Space<br>$.25 per block/week</p>\
                    </a></div><div style="margin: 45px auto 0px auto;"><h2 style="color: #fff;">Hi '+user.value.username+'!</h2><p style="color: #fff">As you have requested for reset password instructions, click the link below</p>\
                    <a style="color: #fff; word-wrap: break-word;" href="https://www.icowall.io/passwordrecovery?id='+recover_string+'">\
                    https://www.icowall.io/passwordrecovery?id='+recover_string+'</a></div></div></html>',
            "text": 'Hi '+user.value.username+'!\n\nAs you have requested for reset password instructions, click the link below\nhttps://www.icowall.io/passwordrecovery?id='+recover_string,
            "subject": 'Password reset',
            "from_email": 'info@icowall.io',
            "from_name": "IcoWall",
            "to": [{
                    "email": user.value.email,
                    "name": user.value.username,
                    "type": "to"
                }],
            "important": false,
            "track_clicks": true
        };
        var async = false;
        mandrill_client.messages.send({"message": mailInfo, "async": async}, function(result) {
            console.log(result);
            res.status(200).json({message:"Email sent"});
        }, function(e) {
            console.log(e)
            res.status(408).json({message:"Error sending the email"}); 
        });
      }else{
        res.status(401).json({message:"Invalid email"});
      }
    });
  }); 

  apiRoutes.get('/logged', passport.authenticate('jwt', { session: false }), function(req, res) {
    res.status(200).json({"message": req.user});
  });

  apiRoutes.get('/signout', passport.authenticate('jwt', { session: false }), function(req, res) {
    res.cookie('jwt', "", { maxAge: 0, httpOnly: true });
    res.status(200).json({"message": 'signout'});
  }); 
}

// $2a$10$OH99v0Bt20oUVQFcx/J7CeQA2tmMzOwoyzqQe/6Y2kmM4V/.WJBkG