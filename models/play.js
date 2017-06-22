var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var PlaySchema = Schema({
  name: {
    type: String,
    required: true,
  },
  
  theatre: {
    type: Schema.ObjectId,
    ref: 'Theatre',
    required: true
  },
  
  description: {
    type: String
  }
});

// export model
module.exports = mongoose.model('Play', PlaySchema);