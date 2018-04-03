require('newrelic');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressSession = require('express-session');
//var passwordless = require('passwordless');
//var MongoStore = require('passwordless-mongostore');
//var email = require('emailjs');
var flash = require('connect-flash');
var validator = require('validator');
var expressValidator = require('express-validator');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var expressTitle = require('express-title');
var compression = require( 'compression' );
var helmet = require( 'helmet' );

var index = require('./routes/index');
var users = require('./routes/users');
var bookingApp = require('./routes/bookingApp');

var User = require('./models/theatre');

var app = express();

try {
  require('dotenv').load();
} catch(err) {}

// set up mongoose connection
var mongoose = require('mongoose');
var mongoDB = process.env.MONGODB_URL;
mongoose.connect(mongoDB);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

require('./config/passport')(passport);

/*
passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({email: username}, function(err, user) {
      if (err) { return done(err); }
      if (!user || !user.validPassword(password)) {
        return done(null, false, {message: 'Virheellinen sähköposti tai salasana'});
      }
      return done(null, user);
    });
  }
));
*/

/*
// setup emailjs server
var smtpServer = email.server.connect({
  user: process.env.SMTP_USER,
  password: process.env.SMTP_PASSWORD,
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  tls: true
});
*/

/*
// setup passwordless
passwordless.init(new MongoStore(mongoDB));
passwordless.addDelivery(function(token, uid, recipient, callback) {
  var host = process.env.SITE_URL;
  var emailBody = 'Hei,\n\nKirjaudu sisään käyttäjätilillesi klikkaamalla seuraavaa linkkiä:\n\n' + host + '?token=' + token + '&uid=' + encodeURIComponent(uid) + '\n\nYstävällisin terveisin\n\nTeatterivaraus';
  // send out token
  smtpServer.send({
    text: emailBody,
    from: 'Teatterivaraus',
    to: recipient,
    subject: 'Kirjaudu sisään'
  }, function(err) {
    if (err) {
      console.log(err);
    }
    callback(err);
  });
});
*/

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

/*
// title setup
app.use(expressTitle('%title% - %base%'));
app.set('title', 'Teatterivaraus');
*/

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator({
  customValidators: {
    isFinnishDate: function(value) {
      var dateArray = value.split('.');
      var re = /^\d?\d\.\d?\d\.\d\d\d\d$/;
      
      if (value.search(re) === -1 || dateArray.length !== 3) {
        return false;
      }
      var year = dateArray[2];
      var month = addLeadingZero(dateArray[1]);
      var day = addLeadingZero(dateArray[0]);
      var dateString = year + '-' + month + '-' + day;
      //console.log(dateString);
      return ! isNaN(Date.parse(dateString));
    },
    isFinnishTime: function(value) {
      var re = /^(?:(?:[0]?[0-9])|(?:[1][0-9])|(?:[2][0-3]))(?:\.[0-5][0-9])?$/;
      return value.search(re) !== -1;
    }
  }
}));
app.use(cookieParser());

app.use( compression() ); // compress all routes
app.use( helmet() );

app.use(express.static(path.join(__dirname, 'public')));

// configure passport
app.use(expressSession({
  secret: process.env.SESSION_SECRET,
  saveUninitialized: false,
  resave: false,
  cookie: {maxAge: 60*60*24*365*10}
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

/*
// passwordless middleware
app.use(passwordless.sessionSupport());
app.use(passwordless.acceptToken( { successRedirect: '/app' } ));
*/

app.use('/app', bookingApp);
app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

function addLeadingZero(value) {
  if (value.length === 1) {
    value = '0' + value;
  }
  return value;
}