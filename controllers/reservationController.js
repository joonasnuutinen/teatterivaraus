var Reservation = require('../models/reservation');
var TicketClass = require('../models/ticketClass');

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

// print reservations
exports.print = function(req, res, next) {
  Reservation.find({show: req.params.id})
    .populate('show tickets.ticketClass')
    .exec(function(err, data) {
      if (err) return next(err);
      console.log(data);
      res.render('printReservations', {title: 'Tuloste', data: data});
  });
};