var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET /login */
router.get('/login', function(req, res) {
  // TODO: jatka tästä ja katso Mozillan tutorialista neuvoa
});


module.exports = router;
