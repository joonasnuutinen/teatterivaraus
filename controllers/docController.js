// Control things related to documentation

// Require models
var Theatre = require('../models/theatre');

// GET docs admin page
exports.getAdmin = function(req, res, next) {
  Theatre.findById(req.user._id).exec(function theatreFound(err, theatre) {
    if (err || theatre.role !== 'admin') return next(err);
    
    res.render('docsAdmin', {title: 'Ohjeet', theatre: theatre});
  });
};