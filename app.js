var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var dotenv = require('dotenv');
var session = require('express-session');
var passwordless = require('passwordless');
var MongoStore = require('passwordless-mongostore');
var email = require('emailjs');

var index = require('./routes/index');
var users = require('./routes/users');
// var config = require('./config');

var app = express();

dotenv.load();

// set up mongoose connection
var mongoose = require('mongoose');
var mongoDB = process.env.MONGODB_URL;
mongoose.connect(mongoDB);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// setup emailjs server
var smtpServer = email.server.connect({
  user: process.env.SMTP_USER,
  password: process.env.SMTP_PASSWORD,
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  tls: true
});

// setup passwordless
passwordless.init(new MongoStore(mongoDB));
passwordless.addDelivery(function(token, uid, recipient, callback) {
  var host = process.env.SITE_URL;
  // TODO: jatka tästä
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

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
