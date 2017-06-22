var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var subReservationSchema = Schema({
  ticketClass: {
    type: Schema.ObjectId,
    ref: 'TicketClass',
    required: true
  },
  
  amount: {
    type: Number,
    min: 0,
    default: 0
  },
  
  reservation: {
    type: Schema.ObjectId,
    ref: 'Reservation',
    required: true
  }
});

// export model
module.exports = mongoose.model('SubReservation', SubReservationSchema);