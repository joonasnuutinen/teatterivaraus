var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var TicketSchema = Schema({
  ticketClass: {
    type: Schema.ObjectId,
    ref: 'TicketClass',
    required: true
  },
  
  reservation: {
    type: Schema.ObjectId,
    ref: 'Reservation',
    required: true
  },
  
  show: {
    type: Schema.ObjectId,
    ref: 'Show',
    required: true
  }
});

// export model
module.exports = mongoose.model('Ticket', TicketSchema);