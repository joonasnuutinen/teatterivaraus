var Theatre = require('../models/theatre');
//var Play = require('../models/play');
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
exports.settingsGet = function(req, res, next) {
  res.render('settings', {title: 'Asetukset', theatre: req.user});
};

// POST settings
exports.settingsPost = function(req, res, next) {
  req.checkBody('playName', 'Kirjoita näytelmän nimi.').notEmpty();
  
  req.sanitize('playName').escape();
  req.sanitize('playName').trim();
  req.sanitize('playDescription').escape();
  req.sanitize('playDescription').trim();
  
  var errors = req.validationErrors();
  
  var theatre = new Theatre({
    name: req.user.name,
    email: req.user.email,
    playName: req.body.playName,
    playDescription: req.body.playDescription,
    _id: req.user._id
  });
  
  if (errors) {
    res.render('settings', {title: 'Asetukset', theatre: theatre, errors: errors});
    return;
  }
  
  Theatre.findByIdAndUpdate(req.user._id, theatre, {}, function(err, updated) {
    if (err) return next(err);
    res.redirect('/app/asetukset');
  });
}

// GET JSON
exports.json = function(req, res, next) {
  Theatre.findById(req.params.theatreId, 'name playName playDescription shows ticketClasses')
    .populate('shows ticketClasses')
    .exec(function(err, results) {
      if (err) return next(err);
      res.json(results);
    });
};

/*
// GET sent
exports.sent = function(req, res, next) {
  res.render('sent', {title: 'Kirjautumislinkki lähetetty'});
};
*/