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
  
  play: {
    type: Schema.ObjectId,
    ref: 'Play',
    required: true
  }
});

// export model
module.exports = mongoose.model('Show', ShowSchema);