'use strict';

var async = require('async');
var Theatre = require('../models/theatre');
var Contact = require('../models/contact');
var Show = require('../models/show');
var TicketClass = require('../models/ticketClass');
var Reservation = require('../models/reservation');
var registerTitle = 'Tilaa';
var mailgun = require( 'mailgun-js' );
var request = require('request');

const showController = require('./showController');

const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

try {
  require('dotenv').load();
} catch(err) {}

// GET login
exports.loginGet = function(req, res, next) {
  res.render('login', {title: 'Kirjaudu'});
};

// GET logout
exports.logoutGet = function(req, res, next) {
  req.logout();
  res.redirect('/kirjaudu');
}

// GET settings
exports.settingsGet = function(req, res, next) {
  res.render('settings', {title: 'Asetukset', theatre: req.user});
};

// POST settings
exports.settingsPost = [
  // Validate fields
  body('playName', 'Kirjoita näytelmän nimi.').isLength({ min: 1 }).trim(),
  body('capacity', 'Virheellinen varausten enimmäismäärä.').optional({ checkFalsy: true }).isInt({ min: 0 }),
  body('closeBefore', 'Virheellinen varausten sulkemisaika.').optional({ checkFalsy: true }).isInt({ min: 0 }),
  
  // Sanitize fields
  sanitizeBody('playName').trim().escape(),
  sanitizeBody('playDescription').trim().escape(),
  sanitizeBody('reservationInstruction').trim().escape(),
  sanitizeBody('emailInstruction').trim().escape(),
  sanitizeBody('additionalInfoExplanation').trim().escape(),
  sanitizeBody('capacity').toInt(),
  sanitizeBody('closeBefore').toInt(),
  
  // Process request
  (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      res.send({ errors: errors.array({ onlyFirstError: true }) });
      return;
    }
    
    Theatre.findById(req.user._id).exec(function theatreFound(err, theatre) {
      if (err) {
        res.send({ errors: err });
        return;
      }
      
      for (let key in req.body) {
        theatre[key] = req.body[key];
      }
      
      theatre.save(function settingsSaved(err) {
        res.send({ errors: err });
      });
    });
  }
];

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
      response.errors = response.errors.concat(errors.array({ onlyFirstError: true }));
      res.send( response );
    }
  } );
};

// GET JSON
exports.json = function(req, res, next) {
  async.parallel({
    theatre: function(callback) {
      Theatre.findById(req.params.theatreId, 'name playName playDescription capacity').exec(callback);
    },
    shows: function(callback) {
      Show.find({theatre: req.params.theatreId})
        .lean({ virtuals: true })
        .sort([['begins', 'ascending']])
        .exec(callback);
    },
    ticketClasses: function(callback) {
      TicketClass.find({theatre: req.params.theatreId})
        .sort([['price', 'descending'], ['name', 'ascending']])
        .exec(callback);
    },
    reservations: function(callback) {
      Reservation.find({ theatre: req.params.theatreId })
        .populate('tickets.ticketClass')
        .exec(callback);
    }
  }, function(err, data) {
    if (err) return next(err);

    showController.updateShowData(data, data.theatre);
    
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