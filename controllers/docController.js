// Control things related to documentation

'use strict';

var Theatre = require('../models/theatre');
var Doc = require('../models/doc');

const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const sanitizeHtml = require('sanitize-html');

// GET docs admin page
exports.getAdmin = function(req, res, next) {
  const theatre = req.user;
  
  if (theatre.role !== 'admin') return next();
    
  res.render('docsAdmin', {title: 'Ohjeet', theatre: theatre});
};

// GET docs in JSON format
exports.getJSON = function(req, res, next) {
  Doc.find().exec(function docsFound(err, docs) {
    if (err) return next(err);
    
    res.json(docs);
  });
}

// POST doc to database
exports.save = [
  // Check privileges
  (req, res, next) => {
    if (req.user.role !== 'admin') {
      res.send({ errors: [{ msg: 'Käyttö estetty' }] });
      return;
    };
    next();
  },
  
  // Validate input
  body('title', 'Otsikko puuttuu').isLength({min: 1}).trim(),
  
  // Sanitize input
  sanitizeBody('title').trim().escape(),
  sanitizeBody('content').trim(),
  
  // Sanitize HTML
  (req, res, next) => {
    req.body.content = sanitizeHtml(req.body.content);
    next();
  },
  
  // Process request
  (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      res.send({ errors: errors.array() });
      return;
    }
    
    var data = req.body;
    data.author = req.user._id;
    
    var doc = new Doc(data);
    
    if (!data._id) {
      // Save as a new doc
      doc.save(callback);
    } else {
      // Update existing doc
      Doc.findByIdAndUpdate(data._id, doc, {}, callback);
    }
    
    function callback(err) {
      if (err) {
        res.send({ errors: [{ msg: 'Tallennus epäonnistui, yritä uudelleen.' }] });
        return;
      }
      
      res.send({ msg: 'Ohje on tallennettu.', data: doc });
    }
  }
];