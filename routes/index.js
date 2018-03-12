var express = require('express');
var router = express.Router();

// require controller modules
var reservationController = require('../controllers/reservationController');
var theatreController = require('../controllers/theatreController');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Etusivu' });
});

/* GET story page. */
router.get('/tarina', function(req, res, next) {
  res.render('story', { title: 'Tarina' });
});

/* GET order page. */
router.get('/ota-kayttoon', function(req, res, next) {
  res.render('register', { title: 'Ota käyttöön' });
});

/* GET benefits page. */
router.get('/ominaisuudet', function(req, res, next) {
  res.render('benefits', { title: 'Ominaisuudet' });
});

// GET theatre JSON
router.get('/:theatreId.json', theatreController.json);

/* customer reservation form */
router.get('/:theatreId', reservationController.customerGet);
router.post('/:theatreId', reservationController.customerPost);



module.exports = router;
