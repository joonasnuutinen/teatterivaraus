var Theatre = require('../models/theatre');
var express = require('express');
var router = express.Router();
var passport = require('passport');


// require controller modules
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({extended: false});
//var passwordless = require('passwordless');

var reservationController = require('../controllers/reservationController');
var theatreController = require('../controllers/theatreController');
var showController = require('../controllers/showController');
var ticketClassController = require('../controllers/ticketClassController');

var login = '/app/kirjaudu';
var register = '/app/rekisteroidy';

// RESERVATIONS =============================

/* GET bookingApp home */
router.get('/', isLoggedIn, reservationController.index);

/* GET reservations */
router.get('/varaukset', isLoggedIn, reservationController.reservations);

// THEATRE =================================

/* GET login */
router.get('/kirjaudu', theatreController.loginGet);

/* POST login */
router.post('/kirjaudu',
  passport.authenticate('local-login', {
    successRedirect: '/app/varaukset',
    failureRedirect: login,
    failureFlash: true
  })
);

/* GET logout */
router.get('/kirjaudu-ulos', theatreController.logoutGet);

/* GET register */
router.get('/rekisteroidy', theatreController.registerGet);

/* POST register */
router.post('/rekisteroidy', passport.authenticate('local-signup', {
  successRedirect: '/app/varaukset',
  failureRedirect: '/app/rekisteroidy',
  failureFlash: true
}));

// STATS ======================================
router.get('/varaustilanne', isLoggedIn, reservationController.stats);

// SHOWS
router.get('/naytokset', isLoggedIn, showController.shows);

// TICKETCLASS
router.get('/lippujen-hinnat', isLoggedIn, ticketClassController.ticketPrices);

router.post('/lippujen-hinnat', isLoggedIn, ticketClassController.newTicketPost);

router.delete('/lippujen-hinnat/:id', isLoggedIn, ticketClassController.delete);

router.put('/lippujen-hinnat/:id', isLoggedIn, ticketClassController.put);

router.get('/lippujen-hinnat/json', isLoggedIn, ticketClassController.ticketPricesJSON);

// SETTINGS ===================================
router.get('/asetukset', isLoggedIn, theatreController.settingsGet);

router.post('/asetukset', isLoggedIn, theatreController.settingsPost);

// ========================================================
// FUNCTIONS ==============================================
// ========================================================
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  res.redirect('/app/kirjaudu');
}

module.exports = router;