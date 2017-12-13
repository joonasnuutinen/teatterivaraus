var async = require('async');
var request = require('request');
var pdf = require('html-pdf');
var fs = require('fs');
var email = require('emailjs');
//var dotenv = require('dotenv');
var Reservation = require('../models/reservation');
var TicketClass = require('../models/ticketClass');
var Show = require('../models/show');
var Theatre = require('../models/theatre');
var Sponsor = require( '../models/sponsor' );

//dotenv.load();

var smtpServer = email.server.connect({
  user: process.env.SMTP_USER,
  password: process.env.SMTP_PASSWORD,
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  tls: true
});

// GET app index page
exports.index = function(req, res, next) {
  res.redirect('/app/varaukset');
};

// GET reservations
exports.reservations = function(req, res, next) {
  var options = {
    schema: 'reservation',
    columnsView: 'fullName show tickets additionalInfo',
    columnsEdit: 'lastName firstName email phone show ticketClasses additionalInfo',
    filterAndPrint: true,
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
      
      reservations.sort(function(a, b) {
        var aString = a.fullName.toUpperCase();
        var bString = b.fullName.toUpperCase();
        if (aString < bString) return -1;
        if (aString > bString) return 1;
        return 0;
      });
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
          amount: req.body[field]
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
        tickets: tickets
      });
      
      reservation.markModified('tickets');
      
      reservation.save(function(err) {
        if (err) {
          message.errors.push('Tallennus epäonnistui, yritä uudelleen.');
        }
      });
    } else {
      message.errors = message.errors.concat(errors.useFirstErrorOnly().array());
    }
    
    res.send(message);
  });
};

// PUT to existing reservation
exports.put = function(req, res, next) {
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
          amount: req.body[field]
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
        _id: req.params.id
      });
      
      reservation.markModified('tickets');

      Reservation.findByIdAndUpdate(req.params.id, reservation, {}, function(err) {
        if (err) {
          message.errors.push('Muokkaus epäonnistui, yritä uudelleen.');
        }
      });
    } else {
      message.errors = message.errors.concat(errors.useFirstErrorOnly().array());
    }
    
    res.send(message);
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
    //console.log(data.shows);
    res.render('stats', {title: 'Varaustilanne', shows: data.shows, total: total});
  });
};

/* REMOVED
// get stats for one show
exports.showStats = function(req, res, next) {
  async.parallel({
    reservations: function(callback) {
      Reservation.find().exec(callback);
    },
    shows: function(callback) {
      Show.find().sort([['begins', 'ascending']]);
    },
    ticketClasses: function(callback) {
      TicketClass.find().sort([['price', 'descending'], ['name', 'ascending']]).exec(callback);
    }, function(err, data) {
      if (err) return next(err);
      data.ticketClasses.forEach();
    }
  });
  
};
*/

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
    res.render('printReservations', {
      title: 'Tuloste',
      show: results.show,
      reservations: results.reservations
    });
  });
};

// print reservations in pdf format
exports.printPdf = function(req, res, next) {
  var sourceUrl = req.protocol + '://' + req.get('host') + '/app/varaukset/tulosta/' + req.params.id + '.html';
  request(sourceUrl, function(error, response, body) {
    if (error) return next(error);
    var options = {
      height: '210mm',
      width: '297mm',
      border: '19mm'
    };
    pdf.create(body, options).toStream(function(err, stream) {
      if (err) return next(err);
      stream.pipe(fs.createWriteStream('./tuloste.pdf'));
    });
  });
};

// GET customer reservation form
exports.customerGet = function(req, res, next) {
  var theatreId = req.params.theatreId;
	
	async.parallel( {
		theatre: function getTheatre(callback) {
			Theatre.findById( theatreId ).exec( callback );
		},
		sponsors: function getSponsors(callback) {
			Sponsor.find( {theatre: theatreId} )
			.sort( [['order', 'ascending']] )
			.exec( callback );
		}
	}, function asyncDone(err, results) {
		if (err) return next(err);
		var theatre = results.theatre;
    
    var title = theatre.name + ': ' + theatre.playName + ' - Teatterivaraus';
    
    var options = {
      schema: 'reservation',
      columnsEdit: 'firstName lastName email phone show ticketClasses additionalInfo',
    };
    
    res.render('customerReservation', {
      title: title,
      theatre: theatre,
			sponsors: results.sponsors,
      options: options
    });
	} );
  
  Theatre.findById(theatreId).exec(function(err, theatre) {
    
  });
};

// POST customer reservation form
exports.customerPost = function(req, res, next) {
  var tickets = [];
  
  for (var field in req.body) {
    var re = /newTicketClass_(\w+)/;
    var match = field.match(re);
    if (match) {
      req.sanitize(field).escape();
      req.sanitize(field).trim();
      req.sanitize(field).toInt();
      tickets.push({
        ticketClass: match[1],
        amount: req.body[field]
      });
    }
  }
  
  req.checkBody('newFirstName', 'Etunimi puuttuu.').notEmpty();
  req.checkBody('newLastName', 'Sukunimi puuttuu.').notEmpty();
  req.checkBody('newEmail', 'Sähköposti puuttuu.').notEmpty();
  req.checkBody('newEmail', 'Virheellinen sähköposti.').isEmail();
  
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
        theatre: req.params.theatreId,
        tickets: tickets
      });
      
      reservation.markModified('tickets');
      
      reservation.save(function(err) {
        if (err) {
          message.errors.push('Varaus epäonnistui, yritä uudelleen.');
        } else {
          //console.log(reservation);
          sendEmailConfirmation(reservation._id, reservation.theatre);
        }
      });
    } else {
      message.errors = message.errors.concat(errors.useFirstErrorOnly().array());
    }
    
    message.data = reservation;
    res.send(message);
  });
}

// GET public form
exports.publicForm = function(req, res, next) {
  var formUrl = '/' + req.user._id;
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
    },
    sponsors: function findSponsors(callback) {
      Sponsor.find( {theatre: theatreId} )
      .sort( [['order', 'ascending']] )
      .exec( callback );
    }
  }, function asyncDone(err, results) {
    if (err) return;
    
    var reservation = results.reservation;
    var sponsors = results.sponsors;
    
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
    
    body += 'Yhteistyössä:\n\n';
    
    sponsors.forEach( function eachSponsor(sponsor) {
      body += sponsor.name + '\n';
      body += sponsor.description + '\n';
      body += 'Lue lisää: ' + sponsor.url + '\n\n';
    } );
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
    
    smtpServer.send(message, function(err) {
      if (err) console.log(err);
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
      
      smtpServer.send({
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