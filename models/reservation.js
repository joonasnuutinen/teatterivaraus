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
    type: Date
  },
  
  edited: {
    type: Date
  },
  
  source: {
    type: String,
    enum: ['webForm', 'dashboard']
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
  }],
  
  marketingPermission: {
    type: Boolean,
    default: false
  }
});

// virtual for full name
ReservationSchema.virtual('fullName')
  .get(function() {
    return this.lastName + ' ' + this.firstName;
});

// virtual for pretty added date
ReservationSchema.virtual('addedPretty').get(function() {
  return moment(this.added).format('D.M.YYYY [klo] H.mm');
});

// virtual for pretty edited date
ReservationSchema.virtual('editedPretty').get(function() {
  return moment(this.edited).format('D.M.YYYY [klo] H.mm');
});

// virtual for total object
ReservationSchema.virtual('total').get(function() {
  var codeArray = [];
  var total = {
    tickets: 0,
    price: 0,
    priceString: '',
    code: '',
    restricted: {}
  };
  this.tickets.forEach(function(ticket) {
    var amount = ticket.amount;
    var ticketClass = ticket.ticketClass;
    
    total.tickets += amount;
    total.price += amount * ticketClass.price;
    
    if (amount !== 0) {
      codeArray.push(amount.toString() + ' × ' + ticketClass.fullName);
      
      if (ticketClass.max < Infinity) {
        total.restricted[ticketClass._id] = amount;
      }
    }
  });
  
  total.priceString = total.price.toString() + ' €';
  total.code = codeArray.join('<br>');
  
  return total;
});

// show virtuals
ReservationSchema.set('toJSON', {virtuals: true});

// export model
module.exports = mongoose.model('Reservation', ReservationSchema);