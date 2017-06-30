var Show = require('../models/show');

// GET shows
exports.shows = function(req, res, next) {
  res.render('shows', {title: 'Näytökset'});
};