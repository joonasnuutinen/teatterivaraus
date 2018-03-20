var async = require('async');
var Theatre = require('../models/theatre');
var Contact = require('../models/contact');
var Show = require('../models/show');
var TicketClass = require('../models/ticketClass');
var registerTitle = 'Tilaa';
var mailgun = require( 'mailgun-js' );
var request = require('request');

try {
  require('dotenv').load();
} catch(err) {}

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

// POST contact
exports.contactPost = function(req, res, next) {
  var response = {
      errors: []
    };
    
  console.log(req.body);
    
  var recaptchaUrl = 'https://www.google.com/recaptcha/api/siteverify';
  request.post({
    url: recaptchaUrl,
    form: {
      secret: process.env.RECAPTCHA_SECRET,
      response: req.body.recaptchaResponse
    },
    function(err, response, body) {
      console.log({
        err: err,
        response: response,
        body: body
      });
      if (err || ! body.success) {
        response.errors.push('reCAPTCHA-varmennus epäonnistui');
      }
    }
  });
  
  req.checkBody('name', 'Teatterin nimi puuttuu').notEmpty();
  req.checkBody('email', 'Sähköpostiosoite puuttuu').notEmpty();
  
  req.sanitize('name').escape();
  req.sanitize('email').escape();
  req.sanitize('beginning').escape();
  req.sanitize('ending').escape();
  req.sanitize('additionalInfo').escape();
  req.sanitize('playName').escape();
  req.sanitize('name').trim();
  req.sanitize('email').trim();
  req.sanitize('beginning').trim();
  req.sanitize('ending').trim();
  req.sanitize('additionalInfo').trim();
  req.sanitize('playName').trim();
  
  req.getValidationResult().then(function(errors) {
    
    
    if (errors.isEmpty() && response.errors.length === 0) {
      var contact = new Contact({
        name: req.body.name,
        email: req.body.email,
        playName: req.body.playName,
        beginning: req.body.beginning,
        ending: req.body.ending,
        additionalInfo: req.body.additionalInfo
      });
      
      contact.save(function(err) {
        //console.log( err );
        if ( err ) {
          response.errors.push( 'Lähetys epäonnistui, yritä uudelleen.' );
        } else {
          response.errors = null;
          response.message = 'Kiitos viestistä! Saat kirjautumistunnukset antamaasi sähköpostiosoitteeseen vuorokauden sisällä.';
          sendFormViaEmail( contact );
        }
        res.send( response );
      });
      
    } else {
      response.errors = response.errors.concat( errors.useFirstErrorOnly().array() );
      res.send( response );
    }
    
    //response.data = contact;
    
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

function sendFormViaEmail(contact) {
  // ---------------------------------------------------------------------
  // email body starts ---------------------------------------------------
  // ---------------------------------------------------------------------
  var body = 'Teatterin nimi: ' + contact.name + '\n';
  body += 'Teatterin sähköposti: ' + contact.email + '\n';
  body += 'Näytelmän nimi: ' + contact.playName + '\n\n';
  
  body += 'Otan palvelun käyttöön\n';
  body += '- alkaen: ' + contact.beginning + '\n';
  body += '- päättyen: ' + contact.ending + '\n\n';
  
  body += 'Lisätietoja: ' + contact.additionalInfo;
  
  // ---------------------------------------------------------------------
  // email body ends -----------------------------------------------------
  // ---------------------------------------------------------------------
  
  var message = {
    text: body,
    from: contact.name + ' <' + contact.email + '>',
    to: process.env.ADMIN_EMAIL,
    "reply-to": contact.email,
    subject: 'Teatterivaraus: Yhteydenotto'
  };
  
  var mailgun = require('mailgun-js')({apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN});
  
  mailgun.messages().send( message, function mailSent(err) {
    if (err) console.log( err );
  });
}