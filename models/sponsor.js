var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var SponsorSchema = Schema({
  name: {
    type: String,
    required: true
  },
  
  description: {
    type: String,
    required: true
  },
  
  url: {
    type: String,
    required: true
  },
  
  order: {
    type: Number,
    default: 0
  },
  
  theatre: {
    type: Schema.ObjectId,
    ref: 'Theatre',
    required: true
  }
});

// show virtuals
//SponsorSchema.set('toJSON', {virtuals: true});

// export model
module.exports = mongoose.model('Sponsor', SponsorSchema);