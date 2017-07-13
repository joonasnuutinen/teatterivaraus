var TicketClass = require('../models/ticketClass');

// ticket prices
exports.ticketPrices = function(req, res, next) {
  var options = {
    schema: 'ticketClass',
    columnsView: 'name priceWithSymbol',
    columnsEdit: 'name price'
  };
  res.render('rows', {title: 'Lippujen hinnat', options: options});
};

// POST new class
exports.newTicketPost = function(req, res, next) {
  req.body.newPrice = req.body.newPrice.replace(',', '.');
  
  req.checkBody('newName', 'Lippuluokan nimi puuttuu.').notEmpty();
  
  req.checkBody('newPrice', 'Lipun hinta puuttuu.').notEmpty();
  req.checkBody('newPrice', 'Lipun hinta ei ole luku.').isFloat();
  
  req.sanitize('newName').escape();
  req.sanitize('newName').trim();
  req.sanitize('newPrice').escape();
  req.sanitize('newPrice').trim();
  req.sanitize('newPrice').toFloat();
  
  req.getValidationResult().then(function(errors) {
    if (errors.isEmpty()) {
      var ticketClass = new TicketClass({
        price: req.body.newPrice,
        theatre: req.user._id,
        name: req.body.newName
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
  TicketClass.find({theatre: req.user._id}, 'name price priceWithSymbol')
    .sort([['price', 'descending']])
    .exec(function(err, ticketClasses) {
      if (err) return next(err);
      res.json(ticketClasses);
    });
};

// GET one ticket class by id via AJAX
exports.getById = function(req, res, next) {
  TicketClass.findById(req.params.id, 'name price')
    .exec(function(err, data) {
      if (err) return next(err);
      res.json(data);
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
  req.body.editedPrice = req.body.editedPrice.replace(',', '.');
  
  req.checkBody('editedName', 'Lippuluokan nimi puuttuu.').notEmpty();
  
  req.checkBody('editedPrice', 'Lipun hinta puuttuu.').notEmpty();
  req.checkBody('editedPrice', 'Lipun hinta ei ole luku.').isFloat();
  
  req.sanitize('editedName').escape();
  req.sanitize('editedName').trim();
  req.sanitize('editedPrice').escape();
  req.sanitize('editedPrice').trim();
  req.sanitize('editedPrice').toFloat();
  
  req.getValidationResult().then(function(errors) {
    var message = {
      errors: []
    };
    
    if (errors.isEmpty()) {
      var ticketClass = new TicketClass({
        price: req.body.editedPrice,
        theatre: req.user._id,
        name: req.body.editedName,
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