var Sponsor = require('../models/sponsor.js');

// GET sponsors
exports.sponsors = function(req, res, next) {
  var options = {
    schema: 'sponsor',
    columnsView: 'name description url',
    columnsEdit: 'name description url order',
  };
  res.render('rows', {title: 'Sponsorit', options: options, theatre: req.user});
};

// POST new sponsor
exports.post = function(req, res, next) {  
  Sponsor.count({theatre: req.user._id}, function(err, sponsorCount) {
    if (err) return next(err);
    
    console.log(req.body);
  
    req.checkBody('newName', 'Nimi puuttuu.').notEmpty();
    req.checkBody('newDescription', 'Kuvaus puuttuu.').notEmpty();
    req.checkBody('newUrl', 'Web-osoite puuttuu.').notEmpty();
    
    console.log('pre-isUrl');
    
    req.checkBody('newUrl', 'Virheellinen web-osoite.').isURL();
    
    console.log('checkBody done');
    
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
        console.log('errors');
        message.errors = message.errors.concat(errors.useFirstErrorOnly().array());
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
      message.errors = message.errors.concat(errors.useFirstErrorOnly().array());
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