var Theatre = require('../models/theatre');
var registerTitle = 'Rekisteröidy';

// GET login
exports.loginGet = function(req, res, next) {
  res.render('login', {title: 'Kirjaudu', errors: req.flash('passwordless')});
};

// GET logout
exports.logoutGet = function(req, res, next) {
  req.logout();
  res.redirect('/app/kirjaudu');
}

// GET register
exports.registerGet = function(req, res, next) {
  res.render('register', {title: registerTitle, errors: req.flash('signupMessage')});
};

// POST register
exports.registerPost = function(req, res, next) {
  req.checkBody('name', 'Teatterin nimi puuttuu').notEmpty();
  req.checkBody('email', 'Sähköpostiosoite puuttuu').notEmpty();
  
  req.sanitize('name').escape();
  req.sanitize('email').escape();
  req.sanitize('name').trim();
  req.sanitize('email').trim();
  
  var errors = req.validationErrors();
  
  var theatre = new Theatre({
    name: req.body.name,
    email: req.body.email
  });
  
  if (errors) {
    res.render('author_form', {title: registerTitle, theatre: theatre, errors: errors});
    return;
  }
  
  // data is valid
  theatre.save(function(err) {
    return next(err);
  });
};

// GET settings
exports.settings = function(req, res, next) {
  res.render('settings', {title: 'Asetukset'});
};

/*
// GET sent
exports.sent = function(req, res, next) {
  res.render('sent', {title: 'Kirjautumislinkki lähetetty'});
};
*/