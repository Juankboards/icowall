const express = require('express');
const bodyParser= require('body-parser');
const fs= require('fs');
const bcrypt = require('bcrypt');
const jwt = require('express-jwt');
const MongoClient = require('mongodb').MongoClient;
const rsaValidation = require('auth0-api-jwt-rsa-validation');
const app = express();
let db;



// let Storage = multer.diskStorage({
//     destination: function (req, file, callback) {
//         callback(null, "./public/uploads");
//     },
//     filename: function (req, file, callback) {
//         callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
//     }
// });

// let upload = multer({ storage: Storage }).single("icon");





MongoClient.connect('mongodb://icowall:C3FE078186CD266D6AB12C32FC81E4CAB77EE6B36ED02EBE38099024D5686260@ds111895.mlab.com:11895/icowall', (err, database) => {
  if (err) return console.log(err)
  db = database;
  app.listen(process.env.PORT || 3000, function () {
    console.log('IcoWall running!');
  })
})

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser({limit: '2mb'}));
app.use(bodyParser.urlencoded({ extended: false }));
app.get('/', function (req, res) {
  res.render('index');
})

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

app.post('/uniqueness', (req, res) => {
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

app.post("/upload", function (req, res) {
    // upload(req, res, function (err) {
    //     if (err) {
    //         return res.end("Something went wrong!");
    //     }
    //     return res.end("File uploaded sucessfully!.");
    // });
    // console.log(req.body);
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
    fs.writeFile("./public/uploads/" + filename, imageBuffer, (err) => {
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

// C3FE078186CD266D6AB12C32FC81E4CAB77EE6B36ED02EBE38099024D5686260

    // bcrypt.compare('somePassword', hash, function(err, res) {
    //   if(res) {
    //    // Passwords match
    //   } else {
    //    // Passwords don't match
    //   } 
    // });