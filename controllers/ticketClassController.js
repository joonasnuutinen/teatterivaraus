var TicketClass = require('../models/ticketClass');

// ticket prices
exports.ticketPrices = function(req, res, next) {
  res.render('ticketPrices', {title: 'Lippujen hinnat'});
};

// POST new class
exports.newTicketPost = function(req, res, next) {
  req.body.newClassPrice = req.body.newClassPrice.replace(',', '.');
  
  req.checkBody('newClassName', 'Lippuluokan nimi puuttuu.').notEmpty();
  
  req.checkBody('newClassPrice', 'Lipun hinta puuttuu.').notEmpty();
  req.checkBody('newClassPrice', 'Lipun hinta ei ole luku.').isFloat();
  
  req.sanitize('newClassName').escape();
  req.sanitize('newClassName').trim();
  req.sanitize('newClassPrice').escape();
  req.sanitize('newClassPrice').trim();
  req.sanitize('newClassPrice').toFloat();
  
  req.getValidationResult().then(function(errors) {
    if (errors.isEmpty()) {
      var ticketClass = new TicketClass({
        price: req.body.newClassPrice,
        theatre: req.user._id,
        name: req.body.newClassName
      });
  
      ticketClass.save(function(err) {
        res.send(
          (err === null) ? {errors: []} : {errors: [{msg:'Tallennus epäonnistui, yritä uudelleen.'}]}
        );
      });
    } else {
      res.send({
        errors: errors.useFirstErrorOnly().array()
      });
    }
  });
  
  
};

// ticket prices JSON get
exports.ticketPricesJSON = function(req, res, next) {
  TicketClass.find({theatre: req.user._id}, 'name price')
    .sort([['price', 'descending']])
    .exec(function(err, ticketClasses) {
      if (err) return next(err);
      res.json(ticketClasses);
    });
};

// DELETE ticket class via AJAX
exports.delete = function(req, res, next) {
  TicketClass.findByIdAndRemove(req.params.id, function(err) {
    var message = {
      errors: []
    };
    
    if (err) {
      message.errors.push({
        msg: 'Lippuluokan poisto epäonnistui, yritä uudelleen.'
      });
    }
    
    res.send(message);
  });
};

// PUT to ticket class via AJAX
exports.put = function(req, res, next) {
  req.body.price = req.body.price.replace(',', '.');
  
  req.checkBody('name', 'Lippuluokan nimi puuttuu.').notEmpty();
  
  req.checkBody('price', 'Lipun hinta puuttuu.').notEmpty();
  req.checkBody('price', 'Lipun hinta ei ole luku.').isFloat();
  
  req.sanitize('name').escape();
  req.sanitize('name').trim();
  req.sanitize('price').escape();
  req.sanitize('price').trim();
  req.sanitize('price').toFloat();
  
  req.getValidationResult().then(function(errors) {
    var message = {
      errors: []
    };
    
    if (errors.isEmpty()) {
      var ticketClass = new TicketClass({
        price: req.body.price,
        theatre: req.user._id,
        name: req.body.name,
        _id: req.params.id
      });
  
      TicketClass.findByIdAndUpdate(req.params.id, ticketClass, {}, function(err) {
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