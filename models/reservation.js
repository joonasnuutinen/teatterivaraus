var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ReservationSchema = Schema({
  customer: {
    type: Schema.ObjectId,
    ref: 'Customer',
    required: true
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
    type: String
  },
  
  theatre: {
    type: Schema.ObjectId,
    ref: 'Theatre',
    required: true
  }
});

// virtual for reservations
ReservationSchema.virtual('subReservations', {
  ref: 'SubReservation',
  localField: '_id',
  foreignField: 'reservation'
});

// export model
module.exports = mongoose.model('Reservation', ReservationSchema);