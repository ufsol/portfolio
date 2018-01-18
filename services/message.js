var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var msgSchema = new Schema({
    name: String,
    email: String,
    message: String,
    ip: String
}, {collection: "subs"});

var msgData = mongoose.model("msgData", msgSchema);

exports.addEntry = function(user, next) {

    var newEntry = new msgData({
      name: user.body.name,
      email: user.body.email.toLowerCase(),
      message: user.body.message,
      ip: user.connection.remoteAddress
    });
    newEntry.save(function(err) {
      if (err) {
        return next(err);
      }
    });
};
