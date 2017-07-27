var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var currency = '€';

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

// virtual for price with symbol
TicketClassSchema
  .virtual('priceWithSymbol')
  .get(function() {
    return this.price.toString() + ' ' + currency;
});

// virtual for full name
TicketClassSchema.virtual('fullName')
  .get(function() {
    return this.name + ' ' + this.priceWithSymbol;
});

// virtual for 

// show virtuals
TicketClassSchema.set('toJSON', {virtuals: true});

// export model
module.exports = mongoose.model('TicketClass', TicketClassSchema);