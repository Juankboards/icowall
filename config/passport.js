const JwtStrategy = require('passport-jwt').Strategy;  
const ExtractJwt = require('passport-jwt').ExtractJwt;  
// const User = require('../app/models/user');  
const config = require('../config/main');

// Setup work and export for the JWT passport strategy
module.exports = function(passport) {  
  const jwtOptions = {};
  jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('jwt');
  jwtOptions.secretOrKey = config.secret;
  passport.use(new JwtStrategy(jwtOptions, function(jwt_payload, done) {
    // User.findOne({id: jwt_payload.id}, function(err, user) {
      // if (err) {
      //   return done(err, false);
      // }
      const user = users.find((user) => user.username == username);
      if (user) {
        done(null, user);
      } else {
        done(null, false);
      }
    }));
  // }));
};

var users = [
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