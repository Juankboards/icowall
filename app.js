const express = require('express');
const bodyParser= require('body-parser')
const jwt = require('express-jwt');
const MongoClient = require('mongodb').MongoClient;
const rsaValidation = require('auth0-api-jwt-rsa-validation');
const app = express();
let db;

MongoClient.connect('mongodb://icowall:C3FE078186CD266D6AB12C32FC81E4CAB77EE6B36ED02EBE38099024D5686260@ds111895.mlab.com:11895/icowall', (err, database) => {
  if (err) return console.log(err)
  db = database
  app.listen(process.env.PORT || 3000, function () {
    console.log('IcoWall running!');
  })
})

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.get('/', function (req, res) {
  res.render('index');
})

app.post('/register', (req, res) => {
  db.collection('users').save(req.body, (err, result) => {
    if (err) return console.log(err)

    console.log('saved to database')
    res.redirect('/')
  })
})

// C3FE078186CD266D6AB12C32FC81E4CAB77EE6B36ED02EBE38099024D5686260