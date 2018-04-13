var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var DocSchema = Schema({
  author: {
    type: Schema.ObjectId,
    ref: 'Theatre'
  },
  
  content: {
    type: String
  },
  
  title: {
    type: String,
    required: true
  }
});

DocSchema.set('timestamps');

// Export model
module.exports = mongoose.model('Doc', DocSchema);