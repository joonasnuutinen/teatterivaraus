// Control things related to documentation

'use strict';

var Theatre = require('../models/theatre');
var Doc = require('../models/doc');

const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const sanitizeHtml = require('sanitize-html');

// Render public docs page
exports.getPublic = function(req, res, next) {
  Doc.find().exec(function docsFound(err, docs) {
    if (err) return next(err);
    
    docs.sort(alphaSort);
    
    res.render('docs', { title: 'Ohjeet', docs: docs });
  });
};

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
    
    docs.sort(alphaSort);
    
    res.json(docs);
  });
};

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
    const defaults = sanitizeHtml.defaults;
    
    const options = {
      allowedTags: defaults.allowedTags.concat(['aside']),
      allowedAttributes: {
        '*': ['class', 'width', 'height'],
        a: ['href', 'name', 'target'],
        iframe: ['src', 'frameborder', 'allow', 'allowfullscreen'],
        img: ['src']
      },
      allowedIframeHostnames: ['www.youtube-nocookie.com']
    };
    
    const original = req.body.content;
    const clean = sanitizeHtml(req.body.content, options);
    
    console.log(`sanitizeHtml compare: ${original.localeCompare(clean)}`);

    req.body.content = clean;
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

// Delete doc from database
exports.delete = function(req, res, next) {
  if (req.user.role !== 'admin') {
      res.send({ errors: [{ msg: 'Käyttö estetty' }] });
      return;
  }
  
  Doc.findByIdAndRemove(req.params.id, function removeTried(err) {
    if (err) {
      res.send({ errors: [{ msg: err }] });
      return;
    }
    
    res.send({ msg: 'Ohje on poistettu.' });
  });
};

/*
  =============================================
  Functions
  =============================================
*/

/**
 * Sort docs alphabetically
 * @param a (Object { title: ... }) First item to be compared
 * @param b (Object { title: ... }) Second item to be compared
 * @return (-1|0|1) -1 if a < b, 1 if a > b, 0 if a == b
 */ 
function alphaSort(a, b) {
  var aString = a.title.toUpperCase();
  var bString = b.title.toUpperCase();
  if (aString < bString) return -1;
  if (aString > bString) return 1;
  return 0;
}