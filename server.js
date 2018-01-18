(function(){

var express = require("express");
var logger = require('morgan');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressValidator = require('express-validator');
var expressSession = require('express-session');
// var mongo = require("mongodb").MongoClient;
// var mongoURL = "mongodb://localhost:27017/test";
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var mongoStore = require('connect-mongo')(expressSession);
var passport = require('passport');
var bcrypt = require('bcryptjs');
var flash = require('connect-flash');
var userService = require('./services/account');
var contactService = require('./services/message');
var passportConfig = require('./auth/passport');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var passportSocketIo = require('passport.socketio');
var sessionStore = new mongoStore({ mongooseConnection: mongoose.connection });
var users = [];

passportConfig();

var nev = require('email-verification')(mongoose);

mongoose.Promise = global.Promise;
mongoose.connect("localhost:27017/test");
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));

  // app.set('view engine', 'html');
  app.engine('html', require('hbs').__express);
  // app.engine('html', require('ejs').renderFile);
  // app.set('view engine', 'ejs');
  // app.set('view options', { layout:'layout.ejs' });
  app.use(express.static(__dirname + "/"));
  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(expressValidator());
  app.use(expressSession({
    secret: 'max',
    store: sessionStore,
    saveUninitialized: false,
    resave: false
  }));
  app.use(cookieParser());
  app.use(flash());

  app.use(passport.initialize());
  app.use(passport.session());

  io.use(passportSocketIo.authorize({
    key: 'connect.sid',
    secret: 'max',
    store: sessionStore,
    passport: passport,
    cookieParser: cookieParser
  }));

  var User = require('./app/userModel');

  nev.configure({
      verificationURL: 'http://localhost:8080/email-verification/${URL}',
      persistentUserModel: User,
      expirationTime: 600,
      tempUserCollection: 'tempAcc',

      transportOptions: {
          service: 'Gmail',
          auth: {
              user: '-',
              pass: '-'
          }
      },
      verifyMailOptions: {
          from: 'Do Not Reply <skzchaotic@gmail.com>',
          subject: 'Please confirm account',
          html: 'Click the following link to confirm your account: <a href="${URL}">${URL}</a>',
          text: 'Please confirm your account by clicking the following link: ${URL}'
      }
  }, function(err, options) {
    if (err) {
      console.log(err);
      return;
    }
    console.log('configured: ' + (typeof options === 'object'));
  });

  nev.generateTempUserModel(User, function(err, tempUserModel) {
    if (err) {
      console.log(err);
      return;
    }
    console.log('generated temp user model: ' + (typeof tempUserModel === 'function'));
  });

  io.on('connection', function(socket){
    var user = socket.request.user.name;
    // console.log(Object.keys(io.sockets.sockets));
    function updateUsers() {
      io.sockets.emit("login", {user: user, users: users});
    }

    if (users.indexOf(user) != -1) {
      //do nothing!!!
    }
    else {
      users.push(user);
    }

    updateUsers();

    socket.on("message", function(data){
      io.sockets.emit("new message", {msg: data, user: user});
    });

    socket.on("disconnect", function(data){
      if (!user) {
        return;
      }
      else {
        users.splice(users.indexOf(user), 1);
      }
      updateUsers();
    });
  });

  app.get(["/", "/about", "/contact"], function (req, res) {
      res.render('index.html');
  });

  app.get("/login", function (req, res) {
      if (req.isAuthenticated()) {
        return res.redirect('/chat');
      }
      var vm = {
        title: "Login",
        error: req.flash("error")
      };
      res.render('login.hbs', vm);
  });

  app.get("/chat", function (req, res) {
    if (!req.isAuthenticated()) {
      return res.redirect('/login');
    }
    var vm = {
      name: req.user ? req.user.name : null,
      users: users
    };
    res.render('chat.hbs', vm);
  });

  app.post("/login", function (req, res, next) {
    if (req.body.rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 3600 * 1000;
    }
    next();
  }, passport.authenticate('local', { successRedirect:'/chat', failureRedirect:'/login', failureFlash: true }));

  app.get("/signup", function (req, res) {
      var vm = {
        title: "SignUp",
        msg: req.flash("error")
      };
      res.render('firstSignup.hbs', vm);
  });

  app.post("/signup", function (req, res) {
    // userService.addUser(req, function(err) {
    //   if (err) {
    //     console.log(err);
    //     var vm = {
    //       input: req.body,
    //       error: err
    //     };
    //     delete vm.input.password;
    //     return res.render('firstSignup.hbs', vm);
    //   }
    //   req.login(req.body, function(err) {
    //     res.redirect('/welcome');
    //   });
    // });
    var newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8), null),
      ip: req.connection.remoteAddress
    });

    nev.createTempUser(newUser, function(err, existingPersistentUser, newTempUser) {
      if (err) {
        console.log(err);
        req.flash("error", 'ERROR: creating temp user FAILED');
        return res.redirect("/signup");
      }

      if (existingPersistentUser) {
        req.flash("error", "You have already signed up and confirmed your account. Did you forget your password?");
        return res.redirect("/signup");
      }

      if (newTempUser) {
        var URL = newTempUser[nev.options.URLFieldName];

        nev.sendVerificationEmail(newUser.email, URL, function(err, info) {
          if (err) {
            console.log(err);
            req.flash("error", 'ERROR: sending verification email FAILED');
            return res.redirect("/signup");
          }
          req.flash("error", "An email has been sent to you. Please check it to verify your account.");
          return res.redirect("/signup");
        });

      } else {
        req.flash("error", "You have already signed up. Please check your email to verify your account.");
        return res.redirect("/signup");
      }
    });
  });

  app.get('/email-verification/:URL', function(req, res) {
    var url = req.params.URL;
    nev.confirmTempUser(url, function(err, user) {
      if (user) {
        nev.sendConfirmationEmail(user.email, function(err, info) {
          if (err) {
            req.flash("error", 'ERROR: sending confirmation email FAILED');
            return res.redirect("/signup");
          }
          req.flash("error", "Email verification complete, you may login now.");
          return res.redirect("/login");
        });
      } else {
        req.flash("error", 'ERROR: confirming temp user FAILED');
        return res.redirect("/signup");
      }
    });
  });

  app.post('/chat', function(req, res) {
    req.logout();
    req.session.destroy();
    res.redirect('/login');
  });

  app.get('/submit', function (req, res) {
      return res.json([{success: req.session.success}, req.session.errors]);
  });

  app.post('/submit', function(req, res) {
    req.check('name', 'Username is too short.').isLength({min: 3});
    req.check('email', 'Invalid email address.').isEmail();
    req.check('message', 'Message is too long, maximum allowed characters: 2000').isLength({max: 2000});

    var errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        req.session.errors = errors;
        req.session.success = false;
    }

    else {
        req.session.success = true;
        contactService.addEntry(req, function(err) {
          if (err) {
            console.log(err);
          }
        });
        res.redirect('/contact');
      }

  });

  app.get('*', function(req, res){
    res.send('This page does not exist', 404);
  });

  server.listen(8080);

    // mongo.connect(mongoURL, function(err, db){
    //   if (!err) {
    //     db.collection("subs").insertOne(item, function(err, result){
    //       console.log(item.name + " sent you a message!");
    //       db.close();
    //     });
    //     res.redirect('/contact');
    //   }
    //   else {
    //       console.log("There is no connection with the database !" + "\n" + err);
    //   }
    // });

    // fs.writeFile('./msg/' + req.body.name, JSON.stringify(req.body), function (err) {
    //   if (err) return console.log(err);
    // });
    // res.send('<h1 class="text-center">success</p>');

    // app.use(function (req, res, next) {
    //   res.locals = {
    //      siteTitle: "My Website's Title",
    //      pageTitle: "The Home Page",
    //      author: "Cory Gross",
    //      description: "My app's description",
    //      };
    //    next();
    // });

    // var http = require("http");
    // var fs = require("fs");
    //
    // http.createServer(function (req, res){
    //     res.writeHead(200, {"Content-Type": "text/html"});
    //     fs.createReadStream(__dirname + "/index.htm").pipe(res);
    // }).listen(8080, "127.0.0.1");

}());
