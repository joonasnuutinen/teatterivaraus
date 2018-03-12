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
    type: String,
    required: true
  },
  
  beginning: {
    type: String
  },
  
  ending: {
    type: String
  },
  
  additionalInfo: {
    type: String
  }
});

// export model
module.exports = mongoose.model('Contact', ContactSchema);