var TicketClass = require('../models/ticketClass');

// ticket prices
exports.ticketPrices = function(req, res, next) {
  res.render('ticketPrices', {title: 'Lippujen hinnat'});
};