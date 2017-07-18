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
    columnsView: 'added lastName firstName email phone show ticketClasses additionalInfo',
    columnsEdit: 'lastName firstName email phone show ticketClasses additionalInfo'
  };
  res.render('rows', {title: 'Varaukset', options: options});
};

// GET reservations JSON
exports.getJSON = function(req, res, next) {
  Reservation.find({theatre: req.user._id})
    .populate('customer')
    .populate('subReservations')
    .sort([['customer.name', 'ascending']])
    .exec(function(err, reservations) {
      if (err) return next(err);      
      res.json(reservations);
  });
};

// POST to reservations
exports.post = function(req, res, next) {
  var ticketClassFields = [];
  
  for (var field in req.body) {
    var re = /newTicketClass_\w+/;
    var match = field.match(re);
    if (match !== null) {
      req.checkBody(match[0], 'Lippujen määrän on oltava kokonaisluku.').isInt(); // min ja max?
    }
  }
  
  req.checkBody('newLastName', 'Sukunimi puuttuu.').notEmpty();
  req.checkBody('newFirstName', 'Etunimi puuttuu.').notEmpty();
  req.checkBody('newEmail', 'Virheellinen sähköposti.').optional({checkFalsy: true}).isEmail();
  req.checkBody('newDate', 'Virheellinen esityspäivä. Vaadittu muoto on pp.kk.vvvv').isFinnishDate();
  req.checkBody('newTime', 'Kellonaika puuttuu.').notEmpty();
  req.checkBody('newTime', 'Virheellinen kellonaika. Vaadittu muoto on hh.mm').isFinnishTime();
  
  req.getValidationResult().then(function(errors) {
    var message = {
      errors: []
    };
    
    if (errors.isEmpty()) {
      req.body.newBegins = convertDate(req.body.newDate, req.body.newTime);
      
      req.sanitize('newBegins').escape();
      req.sanitize('newBegins').trim();
      req.sanitize('newInfo').escape();
      req.sanitize('newInfo').trim();
      req.sanitize('newBegins').toDate();
      
      var show = new Show({
        begins: req.body.newBegins,
        info: req.body.newInfo,
        theatre: req.user._id,
      });
  
      show.save(function(err) {
        if (err) {
          message.errors.push('Muokkaus epäonnistui, yritä uudelleen.');
        }
      });
    } else {
      message.errors = message.errors.concat(errors.useFirstErrorOnly().array());
    }
    
    res.send(message);
  });
}

// GET stats
exports.stats = function(req, res, next) {
  res.render('stats', {title: 'Varaustilanne'});
};