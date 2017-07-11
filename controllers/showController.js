var Show = require('../models/show');

// GET shows
exports.shows = function(req, res, next) {
  res.render('shows', {title: 'Näytökset'});
};

// GET shows JSON
exports.getJSON = function(req, res, next) {
  Show.find({theatre: req.user._id}, 'begins info')
    .sort([['begins', 'ascending']])
    .exec(function(err, shows) {
      if (err) return next(err);
      res.json(shows);
    });
}