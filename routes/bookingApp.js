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
var sponsorController = require('../controllers/sponsorController');
var docController = require('../controllers/docController');

var login = '/app/kirjaudu';
var register = '/app/rekisteroidy';
var redirectUrl = '/app/varaukset';

// RESERVATIONS =============================

/* GET bookingApp home */
router.get('/', isLoggedIn, reservationController.index);

router.get('/varaukset', isLoggedIn, reservationController.reservations);
router.post('/varaukset', isLoggedIn, reservationController.post);

router.get('/varaukset/json', isLoggedIn, reservationController.getJSON);
router.get('/varaukset/tulosta/:id', isLoggedIn, reservationController.printHtml);
//router.get('/varaukset/tulosta/:id.pdf', isLoggedIn, reservationController.printPdf);

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

/* GET register */
router.get('/rekisteroidy', theatreController.registerGet);

/* POST register */
router.post('/rekisteroidy', passport.authenticate('local-signup', {
  successRedirect: redirectUrl,
  failureRedirect: register,
  failureFlash: true
}));

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

// ===========================================================================
// SPONSORS
// ===========================================================================
router.get('/sponsorit', isLoggedIn, sponsorController.sponsors);
router.post('/sponsorit', isLoggedIn, sponsorController.save);

router.get('/sponsorit/json', isLoggedIn, sponsorController.getJSON);

router.get('/sponsorit/sign-s3', isLoggedIn, sponsorController.signS3);

router.post('/sponsorit/order', isLoggedIn, sponsorController.order);

router.get('/sponsorit/:id', isLoggedIn, sponsorController.getById);
router.put('/sponsorit/:id', isLoggedIn, sponsorController.put);
router.delete('/sponsorit/:id', isLoggedIn, sponsorController.delete);

// ===========================================================================
// DOCS (ADMIN)
// ===========================================================================
router.get('/ohjeet', isLoggedIn, docController.getAdmin);
router.get('/ohjeet/json', docController.getJSON);

router.post('/ohjeet', isLoggedIn, docController.save);
router.post('/ohjeet/order', isLoggedIn, docController.saveOrder);

router.delete('/ohjeet/:id', isLoggedIn, docController.delete);

// SETTINGS =========================================================
router.get('/asetukset', isLoggedIn, theatreController.settingsGet);

router.post('/asetukset', isLoggedIn, theatreController.settingsPost);

// PUBLIC Form
router.get('/lomake', isLoggedIn, reservationController.publicForm);

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