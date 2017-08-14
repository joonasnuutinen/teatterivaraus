var async = require('async');
var request = require('request');
var pdf = require('html-pdf');
var fs = require('fs');
var Reservation = require('../models/reservation');
var TicketClass = require('../models/ticketClass');
var Show = require('../models/show');
var Theatre = require('../models/theatre');

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
    filterAndPrint: true
  };
  res.render('rows', {title: 'Varaukset', options: options});
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
      req.checkBody(field, 'Lippujen määrän on oltava kokonaisluku ja vähintään 0.').optional({checkFalsy: true}).isInt({min: 0});
      req.sanitize(field).escape();
      req.sanitize(field).trim();
      req.sanitize(field).toInt();
      tickets.push({
        ticketClass: match[1],
        amount: req.body[field]
      });
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
        info: req.body.newInfo,
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
      req.checkBody(field, 'Lippujen määrän on oltava kokonaisluku ja vähintään 0.').optional({checkFalsy: true}).isInt({min: 0});
      req.sanitize(field).escape();
      req.sanitize(field).trim();
      req.sanitize(field).toInt();
      tickets.push({
        ticketClass: match[1],
        amount: req.body[field]
      });
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
        info: req.body.editedInfo,
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

// DELETE show via AJAX
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
  res.render('stats', {title: 'Varaustilanne'});
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
  
  async.parallel({
    theatre: function(callback) {
      Theatre.findById(theatreId)
        .populate('theatre')
        .exec(callback);
    },
    
    shows: function(callback) {
      Show.find({theatre: theatreId})
        .sort([['begins', 'ascending']])
        .exec(callback);
    },
    
    ticketClasses: function(callback) {
      TicketClass.find({theatre: theatreId})
        .sort([['price', 'descending']])
        .exec(callback);
    }
  }, function(err, results) {
    if (err) return next(err);
    
    var title = results.theatre.name + ': ' + results.theatre.playName + ' - Teatterivaraus';
    
    res.render('customerReservation', {
      title: title,
      theatre: results.theatre,
      shows: results.shows,
      ticketClasses: results.ticketClasses
    });
  });
};

// POST customer reservation form
exports.customerPost = function(req, res, next) {
  var tickets = [];
  
  for (var field in req.body) {
    var re = /ticketClass_(\w+)/;
    var match = field.match(re);
    if (match !== null) {
      req.sanitize(field).escape();
      req.sanitize(field).trim();
      req.sanitize(field).toInt();
      tickets.push({
        ticketClass: match[1],
        amount: req.body[field]
      });
    }
  }
  
  req.checkBody('lastName', 'Sukunimi puuttuu.').notEmpty();
  req.checkBody('email', 'Virheellinen sähköposti.').optional({checkFalsy: true}).isEmail();
  
  req.sanitize('lastName').escape();
  req.sanitize('lastName').trim();
  req.sanitize('firstName').escape();
  req.sanitize('firstName').trim();
  req.sanitize('email').escape();
  req.sanitize('email').trim();
  req.sanitize('phone').escape();
  req.sanitize('phone').trim();
  req.sanitize('additionalInfo').escape();
  req.sanitize('additionalInfo').trim();
  
  req.getValidationResult().then(function(errors) {
    if (errors.isEmpty()) {
      var reservation = new Reservation({
        lastName: req.body.lastName,
        firstName: req.body.firstName,
        email: req.body.email,
        phone: req.body.phone,
        show: req.body.show,
        info: req.body.additionalInfo,
        theatre: req.params.theatreId,
        tickets: tickets
      });
      
      reservation.markModified('tickets'); // TODO: tickets don't get saved!
      
      reservation.save(function(err) {
        if (err) return next(err);
        res.redirect('/varaus-onnistui');
        
      });
    } else {
      var errors = errors.useFirstErrorOnly().array();
      var theatreId = req.params.theatreId;
      
      async.parallel({
        theatre: function(callback) {
          Theatre.findById(theatreId)
            .populate('theatre')
            .exec(callback);
        },
        
        shows: function(callback) {
          Show.find({theatre: theatreId})
            .sort([['begins', 'ascending']])
            .exec(callback);
        },
        
        ticketClasses: function(callback) {
          TicketClass.find({theatre: theatreId})
            .sort([['price', 'descending']])
            .exec(callback);
        }
      }, function(err, results) {
        if (err) return next(err);
        
        var title = results.theatre.name + ': ' + results.theatre.playName + ' - Teatterivaraus';
        
        res.render('customerReservation', {
          title: title,
          theatre: results.theatre,
          shows: results.shows,
          ticketClasses: results.ticketClasses,
          preFill: reservation,
          errors: errors
        });
      });
    }
  });
}

// GET public form
exports.publicForm = function(req, res, next) {
  var formUrl = '/' + req.user._id;
  res.redirect(formUrl);
};