var LocalStrategy = require('passport-local').Strategy;
var Theatre = require('../models/theatre');

var options = {
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
};

module.exports = function(passport) {
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    Theatre.findById(id, function(err, user) {
      done(err, user);
    });
  });
  
  // LOCAL SIGNUP ======================================
  passport.use('local-signup', new LocalStrategy(options, function(req, email, password, done) {
    process.nextTick(function() {
      Theatre.findOne({'email': email}, function(err, user) {
        if (err) {return done(err);}
        if (user) {
          return done(null, false, req.flash('signupMessage', 'Sähköposti on varattu'));
        }
        
        // create new user
        var newUser = new Theatre();
        
        newUser.name = req.body.name;
        newUser.email = email;
        newUser.password = newUser.generateHash(password);
        
        newUser.save(function(err) {
          if (err) { throw err; }
          return done(null, newUser);
        });
      });
    });
  }));
  
  // LOCAL LOGIN =====================================================
  passport.use('local-login', new LocalStrategy(options, loginCallback));
};

function loginCallback(req, email, password, done) {
  Theatre.findOne({'email': email}, function(err, user) {
    if (err) { return done(err); }
    if (!user || !user.validPassword(password)) {
      return done(null, false, req.flash('loginMessage', 'Virheellinen sähköposti tai salasana'));
    }
    
    return done(null, user);
  });
}