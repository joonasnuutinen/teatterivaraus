var express = require('express');
var router = express.Router();
var passport = require('passport');

// require controller modules
var reservationController = require('../controllers/reservationController');
var theatreController = require('../controllers/theatreController');
var showController = require('../controllers/showController');
var ticketClassController = require('../controllers/ticketClassController');

var login = '/kirjaudu';
var register = '/rekisteroidy';
var redirectUrl = '/varaukset';

try {
  require('dotenv').load();
} catch(err) {}


// RESERVATIONS =============================

/* GET bookingApp home */
router.get('/', isLoggedIn, reservationController.index);

router.get('/varaukset', isLoggedIn, reservationController.reservations);
router.post('/varaukset', isLoggedIn, reservationController.post);

router.get('/varaukset/json', isLoggedIn, reservationController.getJSON);
router.get('/varaukset/tulosta/:id', isLoggedIn, reservationController.printHtml);

router.get('/varaukset/:id', isLoggedIn, reservationController.getById);
router.put('/varaukset/:id', isLoggedIn, reservationController.put);
router.delete('/varaukset/:id', isLoggedIn, reservationController.delete);

// THEATRE =================================

/* GET login */
router.get('/kirjaudu', theatreController.loginGet);

/* POST login */
router.post('/kirjaudu',
  passport.authenticate('local-login', {
    successRedirect: redirectUrl,
    failureRedirect: login,
    failureFlash: true
  })
);

/* GET logout */
router.get('/kirjaudu-ulos', theatreController.logoutGet);

/* POST register */
router.post('/rekisteroidy', passport.authenticate('local-signup', {
  successRedirect: redirectUrl,
  failureRedirect: register,
  failureFlash: true
}));

// POST check login status
router.post('/is-logged-in', function checkLoginStatus(req, res, next) {
  let resObj = {
    isLoggedIn: req.isAuthenticated()
  };

  res.send(resObj);
});

/* POST change password */
router.post( '/vaihda-salasana', isLoggedIn, theatreController.changePassword );

// STATS =============================================================
router.get('/varaustilanne', isLoggedIn, reservationController.stats);

// SHOWS =============================================================
router.get('/naytokset', isLoggedIn, showController.shows);
router.post('/naytokset', isLoggedIn, showController.post);

router.get('/naytokset/json', isLoggedIn, showController.getJSON);

router.get('/naytokset/:id', isLoggedIn, showController.getById);
router.put('/naytokset/:id', isLoggedIn, showController.put);
router.delete('/naytokset/:id', isLoggedIn, showController.delete);
// ===========================================================================
// TICKETCLASSES
// ===========================================================================
router.get('/lippujen-hinnat', isLoggedIn, ticketClassController.ticketPrices);
router.post('/lippujen-hinnat', isLoggedIn, ticketClassController.newTicketPost);

router.get('/lippujen-hinnat/json', isLoggedIn, ticketClassController.ticketPricesJSON);

router.get('/lippujen-hinnat/:id', isLoggedIn, ticketClassController.getById);
router.delete('/lippujen-hinnat/:id', isLoggedIn, ticketClassController.delete);
router.put('/lippujen-hinnat/:id', isLoggedIn, ticketClassController.put);

// SETTINGS =========================================================
router.get('/asetukset', isLoggedIn, theatreController.settingsGet);

router.post('/asetukset', isLoggedIn, theatreController.settingsPost);

// PUBLIC Form
router.get('/lomake', isLoggedIn, reservationController.publicForm);

// === FROM index.js

/* GET privacy page. */
router.get('/rekisteriseloste', function(req, res, next) {
  res.redirect(process.env.PRIVACY_PAGE_URL);
});

// GET theatre JSON
router.get('/:theatreId.json', theatreController.json);

/* customer reservation form */
router.get('/:theatreId', reservationController.customerGet);
router.post('/:theatreId', reservationController.customerPost);

// ========================================================
// FUNCTIONS ==============================================
// ========================================================
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect(login);
}

module.exports = router;
