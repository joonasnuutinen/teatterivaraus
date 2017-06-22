var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var CustomerSchema = Schema({
  first_name: {
    type: String,
    required: true
  },
  
  last_name: {
    type: String,
    required: true
  },
  
  email: {
    type: String,
    required: true
  },
  
  phone: {
    type: String
  },
  
  subscriptions: [{
    type: Schema.ObjectId,
    ref: 'Theatre'
  }]
});

// virtual for customer's full name
CustomerSchema
  .virtual('name')
  .get(function() {
    return this.first_name + ' ' + this.last_name;
  });

// export model
module.exports = mongoose.model('Customer', CustomerSchema);  