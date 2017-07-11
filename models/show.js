var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ShowSchema = Schema({
  begins: {
    type: Date,
    required: true
  },
  
  info: {
    type: String
  },
  
  theatre: {
    type: Schema.ObjectId,
    ref: 'Theatre',
    required: true
  }
});

// export model
module.exports = mongoose.model('Show', ShowSchema);