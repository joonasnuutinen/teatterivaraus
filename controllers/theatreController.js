var async = require('async');
var Theatre = require('../models/theatre');
var Show = require('../models/show');
var TicketClass = require('../models/ticketClass');
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

// POST change password
exports.changePassword = function changePassword(req, res, next) {
  req.checkBody( 'oldPassword', 'Vanha salasana puuttuu.' ).notEmpty();
  req.checkBody( 'newPassword', 'Uusi salasana puuttuu.' ).notEmpty();
  req.checkBody( 'retypeNewPassword', 'Vahvista uusi salasana.' ).notEmpty();
  
  req.getValidationResult().then( function errorsValidated(errors) {
    var response = {
      errors: []
    };
    
    if (errors.isEmpty()) {
      if ( !req.user.validPassword( req.body.oldPassword ) ) {
        response.errors.push( { msg: 'Vanha salasana on virheellinen.' } );
        res.send( response );
      } else if ( req.body.newPassword !== req.body.retypeNewPassword ) {
        response.errors.push( { msg: 'Salasanan vahvistus ei täsmää.' } );
        res.send( response );
      } else {
        Theatre.findById( req.user._id, function doPasswordChange(err, theatre) {
          if (err) return next( err );
          
          theatre.password = theatre.generateHash( req.body.newPassword );
          
          theatre.save( function saveTheatre(err) {
            if (err) return next( err );
            response.errors = null;
            response.message = 'Salasanan vaihto onnistui.';
            res.send( response );
          } );
        } );
      }
    } else {
      response.errors = response.errors.concat(errors.useFirstErrorOnly().array());
      res.send( response );
    }
  } );
};

// GET JSON
exports.json = function(req, res, next) {
  async.parallel({
    theatre: function(callback) {
      Theatre.findById(req.params.theatreId, 'name playName playDescription').exec(callback);
    },
    shows: function(callback) {
      Show.find({theatre: req.params.theatreId}).sort([['begins', 'ascending']]).exec(callback);
    },
    ticketClasses: function(callback) {
      TicketClass.find({theatre: req.params.theatreId})
        .sort([['price', 'descending'], ['name', 'ascending']])
        .exec(callback);
    }
  }, function(err, data) {
    if (err) return next(err);
    data.theatre.shows = data.shows;
    data.theatre.ticketClasses = data.ticketClasses;
    res.json(data.theatre);
  });
};

/*
// GET sent
exports.sent = function(req, res, next) {
  res.render('sent', {title: 'Kirjautumislinkki lähetetty'});
};
*/