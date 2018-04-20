var moment = require('moment-timezone');
var Show = require('../models/show');
var Reservation = require('../models/reservation');

// GET shows
exports.shows = function(req, res, next) {
  var options = {
    schema: 'show',
    columnsView: 'beginsLite info',
    columnsEdit: 'date time info enable',
  };
  res.render('rows', {title: 'Näytökset', options: options, theatre: req.user});
};

// POST new show
exports.post = function(req, res, next) {  
  req.body.newTime = req.body.newTime.replace(':', '.');
  
  req.checkBody('newDate', 'Esityspäivä puuttuu.').notEmpty();
  req.checkBody('newDate', 'Virheellinen esityspäivä. Vaadittu muoto on pp.kk.vvvv').isFinnishDate();
  req.checkBody('newTime', 'Kellonaika puuttuu.').notEmpty();
  req.checkBody('newTime', 'Virheellinen kellonaika. Vaadittu muoto on hh.mm').isFinnishTime();
  
  req.getValidationResult().then(function(errors) {
    var message = {
      errors: []
    };
    
    if (errors.isEmpty()) {
      req.body.newBegins = convertDate(req.body.newDate, req.body.newTime);
      
      req.sanitize('newBegins').escape();
      req.sanitize('newBegins').trim();
      req.sanitize('newInfo').escape();
      req.sanitize('newInfo').trim();
      req.sanitize('newBegins').toDate();
      
      var show = new Show({
        begins: req.body.newBegins,
        info: req.body.newInfo,
        enable: req.body.newEnable,
        theatre: req.user._id,
      });
  
      show.save(function(err) {
        if (err) {
          message.errors.push('Muokkaus epäonnistui, yritä uudelleen.');
        }
      });
    } else {
      message.errors = message.errors.concat(errors.array({ onlyFirstError: true }));
    }
    
    res.send(message);
  });
};

// GET shows JSON
exports.getJSON = function(req, res, next) {
  Show.find({theatre: req.user._id})
    .sort([['begins', 'ascending']])
    .exec(function(err, shows) {
      if (err) return next(err);
      res.json(shows);
    });
};

// get one show in JSON format
exports.getById = function(req, res, next) {
  Show.findById(req.params.id)
    .exec(function(err, data) {
      if (err) return next(err);
      res.json(data);
    });
};

// update existing show
exports.put = function(req, res, next) {
  req.body.editedTime = req.body.editedTime.replace(':', '.');
  
  req.checkBody('editedDate', 'Esityspäivä puuttuu.').notEmpty();
  req.checkBody('editedDate', 'Virheellinen esityspäivä. Vaadittu muoto on pp.kk.vvvv').isFinnishDate();
  req.checkBody('editedTime', 'Kellonaika puuttuu.').notEmpty();
  req.checkBody('editedTime', 'Virheellinen kellonaika. Vaadittu muoto on hh.mm').isFinnishTime();
  
  req.getValidationResult().then(function(errors) {
    var message = {
      errors: []
    };
    
    if (errors.isEmpty()) {
      req.body.editedBegins = convertDate(req.body.editedDate, req.body.editedTime);
      
      req.sanitize('editedBegins').escape();
      req.sanitize('editedBegins').trim();
      req.sanitize('editedInfo').escape();
      req.sanitize('editedInfo').trim();
      req.sanitize('editedBegins').toDate();
      
      //console.log( req.body );
      
      var show = new Show({
        begins: req.body.editedBegins,
        info: req.body.editedInfo,
        enable: req.body.editedEnable,
        theatre: req.user._id,
        _id: req.params.id
      });
  
      Show.findByIdAndUpdate(req.params.id, show, {}, function(err) {
        if (err) {
          message.errors.push('Muokkaus epäonnistui, yritä uudelleen.');
        }
      });
    } else {
      message.errors = message.errors.concat(errors.array({ onlyFirstError: true }));
    }
    
    res.send(message);
  });
};

// DELETE show via AJAX
exports.delete = function(req, res, next) {
  Reservation.count({show: req.params.id}, function(err, count) {
    var message = {
      errors: []
    }; 
    if (err) return next(err);
    if (count !== 0) {
      message.errors.push({
        msg: 'Tähän näytökseen on varauksia. Voit poistaa näytöksen vasta kun kaikki sen varaukset on poistettu tai vaihdettu toiselle päivälle.'
      });
    } else {
      Show.findByIdAndRemove(req.params.id, function(err) {        
        if (err) {
          message.errors.push({
            msg: 'Näytöksen poisto epäonnistui, yritä uudelleen.'
          });
        }
      });
    }
    res.send(message);
  });
};

// ==================================================================
// OTHER FUNCTIONS ==================================================
// ==================================================================

function convertDate(date, time) {
  var dateParts = date.split('.');
  var timeParts = time.split('.');
  var year = dateParts[2];
  var month = addLeadingZero(dateParts[1]);
  var day = addLeadingZero(dateParts[0]);
  var hour = addLeadingZero(timeParts[0]);
  var minute = (timeParts.length === 2) ? timeParts[1] : '00';
  var formattedDate = year + '-' + month + '-' + day + 'T' + hour + ':' + minute;
  return moment.tz(formattedDate, 'Europe/Helsinki').format();
}

function addLeadingZero(value) {
  if (value.length === 1) {
    value = '0' + value;
  }
  return value;
}