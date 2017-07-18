var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var CustomerSchema = Schema({
  firstName: {
    type: String,
    required: true
  },
  
  lastName: {
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
    return this.last_name + ' ' + this.first_name;
});

// show virtuals
CustomerSchema.set('toJSON', {virtuals: true});

// export model
module.exports = mongoose.model('Customer', CustomerSchema);  