var TicketClass = require('../models/ticketClass');
var Reservation = require('../models/reservation');

const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

// ticket prices
exports.ticketPrices = function(req, res, next) {
  var options = {
    schema: 'ticketClass',
    columnsView: 'name priceWithSymbol max',
    columnsEdit: 'name price max bypassCounter'
  };
  res.render('rows', {title: 'Lippujen hinnat', options: options, theatre: req.user});
};

// POST new class
exports.newTicketPost = [
  // Replace comma with dot
  (req, res, next) => {
    req.body.newPrice = req.body.newPrice.replace(',', '.');
    next();
  },
  
  // Validate input
  body('newName', 'Lippuluokan nimi puuttuu.').isLength({ min: 1 }).trim(),
  body('newPrice').isLength({ min: 1 }).trim().withMessage('Lipun hinta puuttuu')
    .isFloat({ min: 0 }).withMessage('Lipun hinta ei ole positiivinen luku.'),
  body('newMax', 'Virheellinen maksimimäärä').optional({ checkFalsy: true }).isInt(),
  
  // Sanitize input
  sanitizeBody('newName').escape().trim(),
  sanitizeBody('newPrice').escape().trim().toFloat(),
  sanitizeBody('newMax').escape().trim().toInt(),
  
  // Process request
  (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      res.send({ errors: errors.array({ onlyFirstError: true }) });
      return;
    }
    
    var ticketClass = new TicketClass({
      price: req.body.newPrice,
      theatre: req.user._id,
      name: req.body.newName,
      max: req.body.newMax || Infinity,
      bypassCounter: req.body.newBypassCounter || false
    });
    
    ticketClass.save(function(err) {
      if (err) {
        console.log(err);
        res.send({ errors: [{ msg: 'Tallennus epäonnistui, yritä uudelleen.' }] });
        return;
      }
      res.send({ errors: [] });
    });
  }
];

// ticket prices JSON get
exports.ticketPricesJSON = function(req, res, next) {
  TicketClass.find({theatre: req.user._id})
    .sort([['price', 'descending'], ['name', 'ascending']])
    .exec(function(err, ticketClasses) {
      if (err) return next(err);
      res.json(ticketClasses);
    });
};

// GET one ticket class by id via AJAX
exports.getById = function(req, res, next) {
  TicketClass.findById(req.params.id)
    .exec(function(err, data) {
      if (err) return next(err);
      res.json(data);
    });
};

// DELETE ticket class via AJAX
exports.delete = function(req, res, next) {
  Reservation.find({theatre: req.user._id}, 'tickets').exec(function(err, reservations) {
    var foundTicketClass = false;
    var message = {
      errors: []
    };
    if (err) return next(err);
    for (var i = 0; i < reservations.length; i++) {
      var tickets = reservations[i].tickets;
      for (var j = 0; j < tickets.length; j++) {
        var ticket = tickets[j];
        if (ticket.ticketClass == req.params.id && ticket.amount !== 0) {
          foundTicketClass = true;
          break;
        }
      }
      if (foundTicketClass) {
        break;
      }
    }
    
    if (foundTicketClass) {
      message.errors.push({
        msg: 'Tälle lipputyypille on varauksia. Voit poistaa lipputyypin vasta kun kaikki sen varaukset on poistettu tai vaihdettu toisenlaisiin lippuihin.'
      });
    } else {
      TicketClass.findByIdAndRemove(req.params.id, function(err) {
        if (err) {
          message.errors.push({
            msg: 'Lippuluokan poisto epäonnistui, yritä uudelleen.'
          });
        }
      });
    }
    res.send(message);
  });
};

// PUT to ticket class via AJAX
exports.put = [
  // Replace comma with dot
  (req, res, next) => {
    req.body.editedPrice = req.body.editedPrice.replace(',', '.');
    next();
  },
  
  // Validate input
  body('editedName', 'Lippuluokan nimi puuttuu.').isLength({ min: 1 }).trim(),
  body('editedPrice').isLength({ min: 1 }).trim().withMessage('Lipun hinta puuttuu')
    .isFloat({ min: 0 }).withMessage('Lipun hinta ei ole positiivinen luku.'),
  body('newMax', 'Virheellinen maksimimäärä').optional({ checkFalsy: true }).isInt(),
  
  // Sanitize input
  sanitizeBody('editedName').escape().trim(),
  sanitizeBody('editedPrice').escape().trim().toFloat(),
  sanitizeBody('editedMax').escape().trim().toInt(),
  
  // Process request
  (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      res.send({ errors: errors.array({ onlyFirstError: true }) });
      return;
    }
    
    var ticketClass = new TicketClass({
      price: req.body.editedPrice,
      theatre: req.user._id,
      name: req.body.editedName,
      max: req.body.editedMax,
      bypassCounter: req.body.editedBypassCounter || false,
      _id: req.params.id
    });
    
    TicketClass.findByIdAndUpdate(req.params.id, ticketClass, {}, function(err) {
      res.send(
        (err === null) ? { errors: [] } : { errors: [{ msg: 'Muokkaus epäonnistui, yritä uudelleen.' }] }
      );
    });
  }
];