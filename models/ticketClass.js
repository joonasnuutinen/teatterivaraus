var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var TicketClassSchema = Schema({
  price: {
    type: Number,
    required: true,
  },
  
  theatre: {
    type: Schema.ObjectId,
    ref: 'Theatre',
    required: true
  },
  
  name: {
    type: String,
    required: true
  }
});

// export model
module.exports = mongoose.model('TicketClass', TicketClassSchema);