module.exports = function() {
  var bcrypt = require('bcrypt');
  var passport = require('passport');
  var passportLocal = require('passport-local').Strategy;
  var userService = require('../services/account');

  passport.use(new passportLocal({usernameField:'email'}, function(email, password, next) {
    userService.findUser(email, function(err, user) {
      if (err) {
        console.log(err);
        return next(err);
      }
      if (!user) {
        return next(null, false, { message: 'Incorrect username.' });
      }
        bcrypt.compare(password, user.password, function(err, same) {
          if (err) {
            console.log(err);
            return next(err);
          }
          if (!same) {
            return next(null, false, { message: 'Incorrect password.' });
          }
          next(null, user);
  	  });
    });
  }));

  passport.serializeUser(function(user, next) {
    next(null, user.email);
  });

  passport.deserializeUser(function(email, next) {
    userService.findUser(email, function(err, user) {
      next(err, user);
    });
  });
}
