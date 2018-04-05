var express = require('express');
var router = express.Router();

// require controller modules
var reservationController = require('../controllers/reservationController');
var theatreController = require('../controllers/theatreController');

/* GET home page. */
router.get('/', function(req, res, next) {
  var siteUrl = req.protocol + '://' + req.get('host');
  var og = {
    url: req.protocol + '://' + req.get('host') + req.originalUrl,
    type: 'product',
    title: 'Teatterivaraus - Helpota teatterisi lipunmyyntiä',
    description: 'Teatterivaraus on uusi palvelu, joka helpottaa lippuvarausten vastaanottamista, kirjaamista ja hallintaa.',
    image: siteUrl + '/images/og.png'
  };
  res.render('index', { title: 'Etusivu', og: og });
});

/* GET story page. */
router.get('/tarina', function(req, res, next) {
  res.render('story', { title: 'Tarina' });
});

/* GET support page. */
/*router.get('/tuki', function(req, res, next) {
  res.render('support', { title: 'Tuki' });
});*/

/* GET contact page. */
router.get('/yhteystiedot', function(req, res, next) {
  res.render('contact', { title: 'Yhteystiedot' });
});

/* GET order page. */
router.get('/ota-kayttoon', function(req, res, next) {
  res.render('register', { title: 'Ota käyttöön' });
});

/* GET privacy page. */
router.get('/rekisteriseloste', function(req, res, next) {
  res.render('privacy', { title: 'Rekisteriseloste' });
});

/* POST to order page. */
router.post( '/ota-kayttoon', theatreController.contactPost );

/* GET benefits page. */
/*
router.get('/ominaisuudet', function(req, res, next) {
  res.render('benefits', { title: 'Ominaisuudet' });
});*/

// GET theatre JSON
router.get('/:theatreId.json', theatreController.json);

/* customer reservation form */
router.get('/:theatreId', reservationController.customerGet);
router.post('/:theatreId', reservationController.customerPost);

module.exports = router;
