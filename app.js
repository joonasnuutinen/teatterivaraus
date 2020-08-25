require('newrelic');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressSession = require('express-session');
var flash = require('connect-flash');
var expressValidator = require('express-validator');
var passport = require('passport');
var compression = require( 'compression' );
var helmet = require( 'helmet' );
const MongoStore = require('connect-mongo')(expressSession);

var users = require('./routes/users');
var bookingApp = require('./routes/bookingApp');

var app = express();

// Load environment variables if in development
try {
  require('dotenv').load();
} catch(err) {}

// set up mongoose connection
var mongoose = require('mongoose');
var mongoDB = process.env.MONGODB_URL;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

require('./config/passport')(passport);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
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
  store: new MongoStore({
    mongooseConnection: db,
    touchAfter: 24 * 3600
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use('/', bookingApp);
//app.use('/', index);
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
  res.render('error', { theatre: req.user });
});

module.exports = app;

function addLeadingZero(value) {
  if (value.length === 1) {
    value = '0' + value;
  }
  return value;
}