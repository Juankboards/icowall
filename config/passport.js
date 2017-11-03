const JwtStrategy = require('passport-jwt').Strategy;  
const ExtractJwt = require('passport-jwt').ExtractJwt;  
MongoClient = require('mongodb').MongoClient;


    let db;

   // require('dotenv').load();

    MongoClient.connect(process.env.DATABASE, (err, database) => {
      if (err) return console.log(err)
      db = database;
    })

var cookieExtractor = function(req) {
  var token = null;
  if (req && req.cookies) token = req.cookies['jwt'];
  return token;
};

module.exports = function(passport) {  
  const jwtOptions = {};
  jwtOptions.jwtFromRequest = cookieExtractor;
  jwtOptions.secretOrKey = process.env.JWT_SECRET;
  passport.use(new JwtStrategy(jwtOptions, function(jwt_payload, done) {
      const query = {};
      query["username"] = jwt_payload.username;
      db.collection("users").findOne(query, function(err, user){
          if (user) {
            delete user.password;
            done(null, user);
          } else {
            done(null, false);
          }
      }); 
    }));
};