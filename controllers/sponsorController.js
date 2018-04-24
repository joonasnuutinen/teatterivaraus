var Sponsor = require('../models/sponsor.js');

const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

// GET sponsors
exports.sponsors = function(req, res, next) {
  res.render('dynamic', { title: 'Sponsorit', content: 'sponsors', theatre: req.user });
};

// POST sponsor to database
exports.save = [
  // Validate input
  body('name', 'Nimi puuttuu').isLength({ min: 1 }).trim(),
  body('description', 'Kuvaus puuttuu').isLength({ min: 1 }).trim(),
  body('url').isLength({ min: 1 }).trim().withMessage('Web-osoite puuttuu')
    .isURL().withMessage('Virheellinen web-osoite'),
  
  // Sanitize input
  sanitizeBody('name').trim().escape(),
  sanitizeBody('description').trim().escape(),
  sanitizeBody('url').trim(),
  
  // Process request
  (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      res.send({ errors: errors.array() });
      return;
    }
    
    var data = req.body;
    var sponsor = new Sponsor(data);
    
    if (!data._id) {
      // Save as a new doc
      doc.save(callback);
    } else {
      // Update existing sponsor
      Sponsor.findByIdAndUpdate(data._id, sponsor, {}, callback);
    }
    
    function callback(err) {
      if (err) {
        res.send({ errors: 'Tallennus epäonnistui, yritä uudelleen.' });
        return;
      }
      
      res.send({ msg: 'Sponsori on tallennettu.', data: sponsor });
    }
  }
];

// POST new sponsor
exports.post = function(req, res, next) {  
  Sponsor.count({theatre: req.user._id}, function(err, sponsorCount) {
    if (err) return next(err);
    
    //console.log(req.body);
  
    req.checkBody('newName', 'Nimi puuttuu.').notEmpty();
    req.checkBody('newDescription', 'Kuvaus puuttuu.').notEmpty();
    req.checkBody('newUrl', 'Web-osoite puuttuu.').notEmpty();
    
    //console.log('pre-isUrl');
    
    req.checkBody('newUrl', 'Virheellinen web-osoite.').isURL();
    
    //console.log('checkBody done');
    
    req.getValidationResult().then(function(errors) {
      var message = {
        errors: []
      };
      
      if (errors.isEmpty()) {
        console.log('no errors');
        req.sanitize('newName').escape();
        req.sanitize('newName').trim();
        req.sanitize('newDescription').escape();
        req.sanitize('newDescription').trim();
        
        var sponsor = new Sponsor({
          name: req.body.newName,
          description: req.body.newDescription,
          url: req.body.newUrl,
          order: sponsorCount,
          theatre: req.user._id
        });
    
        sponsor.save(function(err) {
          if (err) {
            message.errors.push('Muokkaus epäonnistui, yritä uudelleen.');
          }
        });
      } else {
        //console.log('errors');
        message.errors = message.errors.concat(errors.array({ onlyFirstError: true }));
      }
      
      res.send(message);
    });
    
  });
};

// GET sponsors JSON
exports.getJSON = function(req, res, next) {
  Sponsor.find({theatre: req.user._id}, 'name description url order')
    .sort([['order', 'ascending']])
    .exec(function(err, sponsors) {
      if (err) return next(err);
      res.json(sponsors);
    });
};

// get one sponsor in JSON format
exports.getById = function(req, res, next) {
  Sponsor.findById(req.params.id, 'name description url order')
    .exec(function(err, data) {
      if (err) return next(err);
      res.json(data);
    });
};

// update existing sponsor
exports.put = function(req, res, next) {
  req.checkBody('editedName', 'Nimi puuttuu.').notEmpty();
  req.checkBody('editedDescription', 'Kuvaus puuttuu.').notEmpty();
  req.checkBody('editedUrl', 'Web-osoite puuttuu.').notEmpty();
  req.checkBody('editedUrl', 'Virheellinen web-osoite.').isURL();
  
  req.getValidationResult().then(function(errors) {
    var message = {
      errors: []
    };
    
    if (errors.isEmpty()) {
      req.sanitize('editedName').escape();
      req.sanitize('editedName').trim();
      req.sanitize('editedDescription').escape();
      req.sanitize('editedDescription').trim();
      req.sanitize('editedOrder').escape();
      req.sanitize('editedOrder').trim();
      req.sanitize('editedOrder').toInt();
      //console.log( req.body );
      var sponsor = new Sponsor({
        name: req.body.editedName,
        description: req.body.editedDescription,
        url: req.body.editedUrl,
        theatre: req.user._id,
        order: req.body.editedOrder,
        _id: req.params.id
      });
  
      Sponsor.findByIdAndUpdate(req.params.id, sponsor, {}, function(err) {
        if (err) {
          message.errors.push('Muokkaus epäonnistui, yritä uudelleen.');
        }
      });
    } else {
      message.errors = message.errors.array({ onlyFirstError: true });
    }
    
    res.send(message);
  });
};

// DELETE sponsor via AJAX
exports.delete = function(req, res, next) {
  Sponsor.findByIdAndRemove(req.params.id, function(err) {
    var message = {
      errors: []
    };
    
    if (err) {
      message.errors.push({
        msg: 'Sponsorin poisto epäonnistui, yritä uudelleen.'
      });
    }
    
    res.send(message);
  });
};