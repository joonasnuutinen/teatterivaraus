var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var TicketClassSchema = Schema({
  price: {
    type: Number,
    required: true,
  },
  
  play: {
    type: Schema.ObjectId,
    ref: 'Play',
    required: true
  },
  
  name: {
    type: String
    required: true
  }
});

// export model
module.exports = mongoose.model('TicketClass', TicketClassSchema);