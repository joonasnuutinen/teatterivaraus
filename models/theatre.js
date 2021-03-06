var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var Schema = mongoose.Schema;

var TheatreSchema = Schema({
  additionalInfoExplanation: {
    type: String
  },

  name: {
    type: String,
    required: true
  },
  
  email: {
    type: String,
    required: true
  },
  
  playName: {
    type: String
  },
  
  slug: {
    type: String
  },
	
	role: {
		type: String,
		enum: ['admin', 'theatre'],
		default: 'theatre'
	},
  
  capacity: {
    type: Number,
    set: nanToInfinity,
    default: Infinity
  },
  
  closeBefore: {
    type: Number,
    set: nanToZero,
    default: 0
  },
  
  password: {
    type: String,
    required: true
  }
});

// VIRTUALS =========================================

// shows
TheatreSchema.virtual('shows', {
  ref: 'Show',
  localField: '_id',
  foreignField: 'theatre'
});

// ticketClasses
TheatreSchema.virtual('ticketClasses', {
  ref: 'TicketClass',
  localField: '_id',
  foreignField: 'theatre'
});

// show virtuals
TheatreSchema.set('toJSON', {virtuals: true});

// METHODS ==========================================

// generate hash
TheatreSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// check if password is valid
TheatreSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

// export model
module.exports = mongoose.model('Theatre', TheatreSchema);

// FUNCTIONS ========================================
function nanToZero(n) {
  return nanToX(n, 0);
}

function nanToInfinity(n) {
  return nanToX(n, Infinity);
}

function nanToX(n, x) {
  if (isNaN(n)) return x;
  return n;
}