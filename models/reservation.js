var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ReservationSchema = Schema({
  customer: {
    type: Schema.ObjectId,
    ref: 'Customer',
    required: true
  },
  
  added: {
    type: Date,
    default: Date.now
  },
  
  additionalInfo: {
    type: String
  }
});

// export model
module.exports = mongoose.model('Reservation', ReservationSchema);