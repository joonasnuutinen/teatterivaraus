var Reservation = require('../models/reservation');

exports.index = function(req, res, next) {
  res.redirect('/app/varaukset');
};

exports.reservations = function(req, res, next) {
  res.render('reservations', {title: 'Varaukset'});
};

exports.stats = function(req, res, next) {
  res.render('stats', {title: 'Varaustilanne'});
};