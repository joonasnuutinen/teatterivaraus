var express = require('express');
var router = express.Router();

// require controller modules
var reservationController = require('../controllers/reservationController');
var theatreController = require('../controllers/theatreController');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Etusivu' });
});

/* GET order page. */
router.get('/tilaa', function(req, res, next) {
  res.render('register', { title: 'Tilaa' });
});

// GET theatre JSON
router.get('/:theatreId.json', theatreController.json);

/* customer reservation form */
router.get('/:theatreId', reservationController.customerGet);
router.post('/:theatreId', reservationController.customerPost);



module.exports = router;
