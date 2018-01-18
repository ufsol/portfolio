var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var Schema = mongoose.Schema;

var accSchema = new Schema({
  name: {type: String, required: 'Please enter your first name.'},
  email: String,
  password: String,
  ip: String,
  createdAt: { type: Date, default: Date.now }
}, {collection: "accs"});

var findUser = function(email, next) {
  User.findOne({email: email.toLowerCase()}, function(err, user) {
    next(err, user);
  });
};

accSchema.path('email').validate(function(value, next) {
  findUser(value, function(err, user) {
    if (err) {
      console.log(err);
      return next(false);
    }
    next(!user);
  });
}, 'That email is already in use.');

var User = mongoose.model('User', accSchema);

exports.addUser = function(user, next) {
  bcrypt.hash(user.body.password, 10, function(err, hash) {
    if (err) {
      return next(err);
    }
    user.body.password = hash;
    var newUser = new User({
      name: user.body.name,
      email: user.body.email.toLowerCase(),
      password: user.body.password,
      ip: user.connection.remoteAddress
    });
    newUser.save(function(err) {
      if (err) {
        return next(err);
      }
      next(null);
    });
  });
};

exports.findUser = findUser;
