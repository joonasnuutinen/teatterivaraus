var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ContactSchema = Schema({
  name: {
    type: String,
    required: true
  },
  
  email: {
    type: String,
    required: true
  },
  
  playName: {
    type: String
  },
  
  beginning: {
    type: String,
    default: ''
  },
  
  ending: {
    type: String,
    default: ''
  },
  
  additionalInfo: {
    type: String,
    default: ''
  },
  
  submitted: {
    type: Date,
    default: Date.now()
  }
});

// export model
module.exports = mongoose.model('Contact', ContactSchema);