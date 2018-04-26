var Sponsor = require('../models/sponsor.js');
const aws = require('aws-sdk');

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
  body('url', 'Virheellinen web-osoite').optional({ checkFalsy: true }).isURL(),
  body('imageUrl', 'Virheellinen kuva').optional({ checkFalsy: true }).isURL(),
  
  // Sanitize input
  sanitizeBody('name').trim().escape(),
  sanitizeBody('description').trim().escape(),
  sanitizeBody('url').trim(),
  sanitizeBody('imageUrl').trim(),
  
  // Process request
  (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      res.send({ errors: errors.array() });
      return;
    }
    
    var sponsor = new Sponsor({
      name: req.body.name,
      description: req.body.description,
      url: req.body.url,
      imageUrl: req.body.imageUrl,
      theatre: req.user._id,
      _id: req.body._id
    });
    
    if (!req.body._id) {
      // Save as a new sponsor
      sponsor.save(callback);
    } else {
      // Update existing sponsor
      Sponsor.findByIdAndUpdate(req.body._id, sponsor, {}, callback);
    }
    
    function callback(err) {
      if (err) {
        console.log(err);
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
  
    req.checkBody('newName', 'Nimi puuttuu.').notEmpty();
    req.checkBody('newDescription', 'Kuvaus puuttuu.').notEmpty();
    req.checkBody('newUrl', 'Web-osoite puuttuu.').notEmpty();
    
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
  Sponsor.find({theatre: req.user._id})
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

// Generate S3 signature
exports.signS3 = function(req, res, next) {
  const s3 = new aws.S3();
  const folder = `uploads/${req.user.slug}/`;
  const fileName = folder + req.query.fileName;
  const fileType = req.query.fileType;
  
  const acceptedFileTypes = ['image/jpeg', 'image/png'];
  const reString = acceptedFileTypes.join('|');
  const re = new RegExp(reString);
  
  if (!re.test(fileType)) return res.send(JSON.stringify({ error: 'Virheellinen tiedostomuoto.' }));
  
  const S3_BUCKET = process.env.S3_BUCKET;
  const s3Params = {
    Bucket: S3_BUCKET,
    Key: fileName,
    Expires: 60,
    ContentType: fileType,
    ACL: 'public-read'
  };
  
  s3.getSignedUrl('putObject', s3Params, (err, data) => {
    if (err) return res.end();
    
    const returnData = {
      signedRequest: data,
      url: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + fileName
    }
    
    res.write(JSON.stringify(returnData));
    res.end();
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