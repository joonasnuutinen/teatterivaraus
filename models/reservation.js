var mongoose = require('mongoose');
var moment = require('moment');
var TicketClass = require('./ticketClass');

var Schema = mongoose.Schema;

var ReservationSchema = Schema({
  lastName: {
    type: String,
    required: true
  },
  
  firstName: {
    type: String,
  },
  
  email: {
    type: String
  },
  
  phone: {
    type: String
  },
  
  show: {
    type: Schema.ObjectId,
    ref: 'Show',
    required: true
  },
  
  added: {
    type: Date,
    default: Date.now()
  },
  
  additionalInfo: {
    type: String,
    default: ''
  },
  
  theatre: {
    type: Schema.ObjectId,
    ref: 'Theatre',
    required: true
  },
  
  tickets: [{
    ticketClass: {
      type: Schema.ObjectId,
      ref: 'TicketClass',
      required: true
    },
    
    amount: {
      type: Number,
      min: 0,
      default: 0
    }
  }]
});

// virtual for full name
ReservationSchema.virtual('fullName')
  .get(function() {
    return this.lastName + ' ' + this.firstName;
});

// virtual for pretty date
ReservationSchema.virtual('addedPretty').get(function() {
  return moment(this.added).format('D.M.YYYY [klo] H.mm');
});

// virtual for price
ReservationSchema.virtual('total').get(function() {
  var total = {
    tickets: 0,
    price: 0
  };
  this.tickets.forEach(function(ticket) {
    total.tickets += ticket.amount;
    total.price += ticket.amount * ticket.ticketClass.price;
  });
  return total;
});

/*
// virtual for reservations
ReservationSchema.virtual('subReservations', {
  ref: 'SubReservation',
  localField: '_id',
  foreignField: 'reservation'
});
*/

// show virtuals
ReservationSchema.set('toJSON', {virtuals: true});

// export model
module.exports = mongoose.model('Reservation', ReservationSchema);