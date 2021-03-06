'use strict';

var async = require('async');
var request = require('request');
var Reservation = require('../models/reservation');
var TicketClass = require('../models/ticketClass');
var Show = require('../models/show');
var Theatre = require('../models/theatre');
const showController = require('./showController');

try {
  require('dotenv').load();
} catch(err) {}

const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

// GET app index page
exports.index = function(req, res, next) {
  res.redirect('/varaukset');
};

// GET reservations
exports.reservations = function(req, res, next) {
  var options = {
    schema: 'reservation',
    columnsView: 'source fullName show tickets additionalInfo',
    columnsEdit: 'lastName firstName email phone show ticketClasses additionalInfo marketingPermission',
    filterAndPrint: true
  };
  res.render('rows', {title: 'Varaukset', options: options, theatre: req.user});
};

// GET reservations JSON
exports.getJSON = function(req, res, next) {
  Reservation.find({theatre: req.user._id})
    .populate('show tickets.ticketClass')
    .exec(function(err, reservations) {
      if (err) return next(err);      
      reservations = reservations.filter(function(reservation) {
        var show = (req.query.show) ? req.query.show : '';
        var keyword = (req.query.keyword) ? req.query.keyword : '';
        var re = new RegExp(keyword, 'i');
        var matchesShowFilter = (show == '' || show == reservation.show._id);
        return matchesShowFilter && reservation.fullName.search(re) != -1;
      });
      
      reservations.sort(sortReservations);
      res.json(reservations);
  });
};

// GET one reservation in JSON format
exports.getById = function(req, res, next) {
  Reservation.findById(req.params.id)
    .populate('show tickets.ticketClass')
    .exec(function(err, data) {
      if (err) return next(err);
      res.json(data);
    });
};

// POST to reservations
exports.post = function(req, res, next) {
  TicketClass.find({ theatre: req.user._id }).sort([['price', 'descending'], ['name', 'ascending']]).exec(function(err, ticketClasses) {
    var tickets = [];
  
    for (var field in req.body) {
      var re = /newTicketClass_(\w+)/;
      var match = field.match(re);
      if (match !== null) {
        req.checkBody(field, 'Lippujen määrän on oltava kokonaisluku ja vähintään 0.').isInt({min: 0});
        req.sanitize(field).escape();
        req.sanitize(field).trim();
        req.sanitize(field).toInt();
        if (req.body[field] > 0) {
          tickets.push({
            ticketClass: match[1],
            amount: req.body[field],
            bypassCounter: ticketClasses.find(function(tc) { return tc._id.equals(match[1]); }).bypassCounter
          });
        }
      }
    }
    
    req.checkBody('newLastName', 'Sukunimi puuttuu.').notEmpty();
    req.checkBody('newEmail', 'Virheellinen sähköposti.').optional({checkFalsy: true}).isEmail();
    
    req.sanitize('newLastName').escape();
    req.sanitize('newLastName').trim();
    req.sanitize('newFirstName').escape();
    req.sanitize('newFirstName').trim();
    req.sanitize('newEmail').escape();
    req.sanitize('newEmail').trim();
    req.sanitize('newPhone').escape();
    req.sanitize('newPhone').trim();
    req.sanitize('newAdditionalInfo').escape();
    req.sanitize('newAdditionalInfo').trim();
    
    req.getValidationResult().then(function(errors) {
      var message = {
        errors: []
      };
      
      if (errors.isEmpty()) {
        var reservation = new Reservation({
          lastName: req.body.newLastName,
          firstName: req.body.newFirstName,
          email: req.body.newEmail,
          phone: req.body.newPhone,
          show: req.body.newShow,
          additionalInfo: req.body.newAdditionalInfo,
          theatre: req.user._id,
          tickets: tickets,
          source: 'dashboard',
          added: Date.now(),
          marketingPermission: req.body.newMarketingPermission
        });
        
        reservation.markModified('tickets');
        
        reservation.save(function(err) {
          if (err) {
            message.errors.push('Tallennus epäonnistui, yritä uudelleen.');
          }
        });
      } else {
        message.errors = message.errors.concat(errors.array({ onlyFirstError: true }));
      }
      
      res.send(message);
    });
  });
  
};

// PUT to existing reservation
exports.put = function(req, res, next) {
  TicketClass.find({ theatre: req.user._id }).sort([['price', 'descending'], ['name', 'ascending']]).exec(function(err, ticketClasses) {
    var tickets = [];
    
    for (var field in req.body) {
      var re = /editedTicketClass_(\w+)/;
      var match = field.match(re);
      if (match !== null) {
        req.checkBody(field, 'Lippujen määrän on oltava kokonaisluku ja vähintään 0.').isInt({min: 0});
        req.sanitize(field).escape();
        req.sanitize(field).trim();
        req.sanitize(field).toInt();
        if (req.body[field] > 0) {
          tickets.push({
            ticketClass: match[1],
            amount: req.body[field],
            bypassCounter: ticketClasses.find(function(tc) { return tc._id.equals(match[1]); }).bypassCounter
          });
        }
      }
    }
    
    req.checkBody('editedLastName', 'Sukunimi puuttuu.').notEmpty();
    req.checkBody('editedEmail', 'Virheellinen sähköposti.').optional({checkFalsy: true}).isEmail();
    
    req.sanitize('editedLastName').escape();
    req.sanitize('editedLastName').trim();
    req.sanitize('editedFirstName').escape();
    req.sanitize('editedFirstName').trim();
    req.sanitize('editedEmail').escape();
    req.sanitize('editedEmail').trim();
    req.sanitize('editedPhone').escape();
    req.sanitize('editedPhone').trim();
    req.sanitize('editedAdditionalInfo').escape();
    req.sanitize('editedAdditionalInfo').trim();
    
    req.getValidationResult().then(function(errors) {
      var message = {
        errors: []
      };
      
      if (errors.isEmpty()) {
        var reservation = new Reservation({
          lastName: req.body.editedLastName,
          firstName: req.body.editedFirstName,
          email: req.body.editedEmail,
          phone: req.body.editedPhone,
          show: req.body.editedShow,
          additionalInfo: req.body.editedAdditionalInfo,
          theatre: req.user._id,
          tickets: tickets,
          edited: Date.now(),
          _id: req.params.id,
          marketingPermission: req.body.editedMarketingPermission
        });
        
        reservation.markModified('tickets');

        Reservation.findByIdAndUpdate(req.params.id, reservation, {}, function(err) {
          if (err) {
            message.errors.push('Muokkaus epäonnistui, yritä uudelleen.');
          }
        });
      } else {
        message.errors = message.errors.concat(errors.array({ onlyFirstError: true }));
      }
      
      res.send(message);
    });
  });
};

// DELETE reservation via AJAX
exports.delete = function(req, res, next) {
  Reservation.findByIdAndRemove(req.params.id, function(err) {
    var message = {
      errors: []
    };
    
    if (err) {
      message.errors.push({
        msg: 'Varauksen poisto epäonnistui, yritä uudelleen.'
      });
    }
    
    res.send(message);
  });
};

// GET stats
exports.stats = function(req, res, next) {
  async.parallel({
    reservations: function(callback) {
      Reservation.find({theatre: req.user._id}).exec(callback);
    },
    shows: function(callback) {
      Show.find({theatre: req.user._id})
        .sort([['begins', 'ascending']])
        .lean({virtuals: true})
        .exec(callback);
    }
  }, function(err, data) {
    if (err) return next(err);
    var total = 0;
    
    data.shows.forEach(function(show) {
      show.reservationCount = 0;
    });
    
    data.reservations.forEach(function(reservation) {
      var showId = reservation.show;
      var ticketAmount = reservation.total.tickets;
      var showIndex = data.shows.findIndex(function(show) {
        return showId.equals(show._id);
      });
      
      data.shows[showIndex].reservationCount += ticketAmount;
      total += ticketAmount;
    });
    
    res.render('stats', {title: 'Varaustilanne', theatre: req.user, shows: data.shows, total: total});
  });
};

// print reservations in html format
exports.printHtml = function(req, res, next) {
  async.parallel({
    show: function(callback) {
      Show.findById(req.params.id).exec(callback);
    },
    reservations: function(callback) {
      Reservation.find({show: req.params.id})
        .populate('tickets.ticketClass')
        .exec(callback);
    }
  }, function(err, results) {
    if (err) return next(err);
    results.reservations.sort(sortReservations);
    res.render('printReservations', {
      title: 'Tuloste',
      show: results.show,
      reservations: results.reservations
    });
  });
};

// GET customer reservation form
exports.customerGet = function(req, res, next) {
  Theatre.findOne({ slug: req.params.theatreId }).exec(function(err, theatre) {
    if (err || !theatre) return next(err);
    
    const id = theatre.id;
    
    async.parallel({
      shows: function(callback) {
        Show
          .find({ theatre: id })
          .lean({ virtuals: true })
          .sort([['begins', 'ascending']])
          .exec(callback);
      },
      
      reservations: function(callback) {
        Reservation
          .find({ theatre: id })
          .populate('tickets.ticketClass')
          .exec(callback);
      },
      
      ticketClasses: function(callback) {
        TicketClass
          .find({ theatre: id })
          .sort([['price', 'descending'], ['name', 'ascending']])
          .exec(callback);
      }
    }, function asyncDone(err, data) {
      const title = theatre.name + ': ' + theatre.playName + ' - Teatterivaraus';
      const siteUrl = req.protocol + '://' + req.get('host');
      const og = {
        url: req.protocol + '://' + req.get('host') + req.originalUrl,
        type: 'product',
        title: title,
        description: 'Varaa lippuja esitykseen ' + theatre.playName + '.',
        image: siteUrl + '/images/og.png'
      };
      showController.updateShowData(data, theatre);
      
      res.render('customerReservation', {
        title: title,
        theatre: theatre,
        shows: data.shows,
        ticketClasses: data.ticketClasses,
        og: og
      });
    });
  });
};

// POST customer reservation form
exports.customerPost = [
  // Validate fields
  body('firstName', 'Etunimi puuttuu.').isLength({ min: 1 }).trim(),
  body('lastName', 'Sukunimi puuttuu.').isLength({ min: 1 }).trim(),
  body('email').isLength({ min: 1 }).trim().withMessage('Sähköposti puuttuu.')
    .isEmail().withMessage('Virheellinen sähköposti.'),
  body('show', 'Näytöstä ei ole valittu.').isLength({ min: 1 }).trim(),
  body('ticketClass_*', 'Lippujen määrän on oltava kokonaisluku ja vähintään 0.').isInt({ min: 0 }),
  body('marketingPermission', 'Virheellinen sähköpostilupa').isBoolean(),
  
  // Sanitize fields
  sanitizeBody('firstName').trim().escape(),
  sanitizeBody('lastName').trim().escape(),
  sanitizeBody('email').trim().escape(),
  sanitizeBody('phone').trim().escape(),
  sanitizeBody('additionalInfo').trim().escape(),
  sanitizeBody('ticketClass_*').trim().escape().toInt(),
  sanitizeBody('marketingPermission').trim().escape().toBoolean(),
  
  // Process request
  (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty) {
      res.send({ errors: errors.array({ onlyFirstError: true }) });
      return;
    }
      
    const recaptchaUrl = 'https://www.google.com/recaptcha/api/siteverify';
    
    // Recaptcha request
    request.post({
      url: recaptchaUrl,
      form: {
        secret: process.env.RECAPTCHA_SECRET_V2,
        response: req.body['g-recaptcha-response']
      }
    }, function(err, gResponse, body) {
      var data = JSON.parse(body);

      if (err || ! data.success) {
        res.send({ errors: 'reCAPTCHA-varmennus epäonnistui, yritä uudelleen' });
        return;
      }
      
      req.body.tickets = [];

      async.parallel({
        theatre: function(callback) {
          Theatre
            .findById(req.params.theatreId)
            .exec(callback);
        },

        shows: function(callback) {
          Show
            .find({ _id: req.body.show })
            .lean({ virtuals: true })
            .exec(callback);
        },
        
        reservations: function(callback) {
          Reservation
            .find({ show: req.body.show })
            .populate('tickets.ticketClass')
            .exec(callback);
        },
        
        ticketClasses: function(callback) {
          TicketClass
            .find({ theatre: req.params.theatreId })
            .sort([['price', 'descending'], ['name', 'ascending']])
            .exec(callback);
        }
      }, function asyncDone(err, data) {
        if (err) {
          res.send({ errors: ['Palvelinvirhe'] });
          return;
        }

        if (!data.theatre) {
          res.send({ errors: 'Palvelinvirhe: !data.theatre == true' });
          return;
        }
        
        showController.updateShowData(data, data.theatre);

        // Check if reservations for the show are closed
        if (data.shows[0].isClosed) {
          res.send({ errors: 'Lippujen varaus valittuun näytökseen on sulkeutunut.', update: true });
          return;
        }
        
        for (let field in req.body) {
          var re = /ticketClass_(\w+)/;
          var match = field.match(re);
          if (match) {
            req.body.tickets.push({
              ticketClass: match[1],
              amount: req.body[field],
              bypassCounter: data.ticketClasses.find(function(tc) { return tc._id.equals(match[1]); }).bypassCounter
            });
            delete req.body[field];
          }
        }
        
        var reservation = new Reservation(req.body);
        reservation = reservation.populate('total');
        console.log(reservation);

        // Check if restricted tickets are available
        // Restricted tickets will be removed in a future PR so this is not implemented


        // TODO: Check if total is available
        // This will be implemented in a future PR

        reservation.theatre = req.params.theatreId;
        reservation.source = 'webForm';
        reservation.added = Date.now();
        
        reservation.markModified('tickets');
        
        reservation.save(function(err) {
          if (err) {
            res.send({ errors: 'Varaus epäonnistui, yritä uudelleen.' });
          } else {
            sendEmailConfirmation(reservation._id, reservation.theatre);
            res.send({ errors: null, email: reservation.email });
          }
        });

      });
    });
  }
];

// GET public form
exports.publicForm = function(req, res, next) {
  var id = req.user.slug || req.user._id;
  var formUrl = '/' + id;
  res.redirect(formUrl);
};

// ===========================================================================
// FUNCTIONS =================================================================
// ===========================================================================

function sendEmailConfirmation(id, theatreId) {
  async.parallel( {
    reservation: function findReservation(callback) {
      Reservation.findById( id )
      .populate( 'show theatre tickets.ticketClass' )
      .exec( callback );
    }
  }, function asyncDone(err, results) {
    if (err) return;
    
    var reservation = results.reservation;
    
    // ---------------------------------------------------------------------
    // email body starts ---------------------------------------------------
    // ---------------------------------------------------------------------
    var body = 'Kiitos varauksestasi!\n\n';
    
    body += 'Varauksen tiedot:\n\n';
    
    body += reservation.theatre.name + ': ' + reservation.theatre.playName + '\n';
    body += 'Näytös: ' + reservation.show.beginsPretty + '\n\n';
    
    body += 'Nimi: ' + reservation.fullName + '\n';
    body += 'Sähköposti: ' + reservation.email + '\n';
    body += reservation.phone ? 'Puhelin: ' + reservation.phone + '\n\n' : '\n';
    
    body += reservation.additionalInfo ? 'Lisätietoja: ' + reservation.additionalInfo + '\n\n' : '';
    
    body += 'Varatut liput:\n'
    body += reservation.total.code.replace(/<br>/g, '\n') + '\n\n';
    
    body += 'Yhteensä: ' + reservation.total.priceString + '\n\n';

    // ---------------------------------------------------------------------
    // email body ends -----------------------------------------------------
    // ---------------------------------------------------------------------
    
    var message = {
      text: body,
      from: reservation.theatre.name + ' <' + reservation.theatre.email + '>',
      to: reservation.email,
      "reply-to": reservation.theatre.email,
      subject: 'Lippuvarauksesi on vastaanotettu'
    };
    
    var mailgun = require('mailgun-js')({apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN});
    
    mailgun.messages().send( message, function mailSent(err) {
      if (err) console.log( err );
    });
    
    if (reservation.additionalInfo) {
      // -------------------------------------------------------------------
      // email body starts -------------------------------------------------
      // -------------------------------------------------------------------
      var enquiryBody = reservation.additionalInfo + '\n\n';
      
      enquiryBody += '(Tämän viestin lähetti Teatterivarauksen automaattisuodatin.)';
      // -------------------------------------------------------------------
      // email body ends ---------------------------------------------------
      // -------------------------------------------------------------------
      
      mailgun.messages().send({
        text: enquiryBody,
        from: reservation.firstName + ' ' + reservation.lastName + ' <' + reservation.email + '>',
        to: reservation.theatre.email,
        "reply-to": reservation.email,
        subject: 'Teatterivaraus: Tiedustelu esityksestä ' + reservation.theatre.playName
      }, function(err) {
        if (err) console.log(err);
      });
    }
  } );
}

// Sort reservations based on full name
function sortReservations(a, b) {
  var aString = a.fullName.toUpperCase();
  var bString = b.fullName.toUpperCase();
  if (aString < bString) return -1;
  if (aString > bString) return 1;
  return 0;
}