var mongoose = require('mongoose'),
    bcrypt = require('bcryptjs');

var userSchema = mongoose.Schema({
    name: String,
    email: String,
    password: String,
    ip: String,
    createdAt: { type: Date, default: Date.now }
  });

userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('acc', userSchema);
