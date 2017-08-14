var express = require('express');
var router = express.Router();

// require controller modules
var reservationController = require('../controllers/reservationController');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* customer reservation form */
router.get('/:theatreId', reservationController.customerGet);
router.post('/:theatreId', reservationController.customerPost);


module.exports = router;
