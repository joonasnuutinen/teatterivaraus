var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var TheatreSchema = Schema({
  name: {
    type: String,
    required: true
  },
  
  email: {
    type: String,
    required: true
  },
  
  password: {
    type: String,
    required: true
  }
});

// export model
module.exports = mongoose.model('Theatre', TheatreSchema);