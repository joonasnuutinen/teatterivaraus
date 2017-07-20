var mongoose = require('mongoose');
var moment = require('moment');

var Schema = mongoose.Schema;

var ShowSchema = Schema({
  begins: {
    type: Date,
    required: true
  },
  
  info: {
    type: String,
    default: ''
  },
  
  theatre: {
    type: Schema.ObjectId,
    ref: 'Theatre',
    required: true
  }
});

// virtual for year
ShowSchema
  .virtual('year')
  .get(function() {
    return moment(this.begins).format('YYYY');
});

// virtual for month
ShowSchema
  .virtual('month')
  .get(function() {
    return moment(this.begins).format('M');
});

// virtual for day
ShowSchema
  .virtual('day')
  .get(function() {
    return moment(this.begins).format('D');
});

// virtual for weekday
ShowSchema
  .virtual('weekday')
  .get(function() {
    return moment(this.begins).format('d');
});

// virtual for hour
ShowSchema
  .virtual('hour')
  .get(function() {
    return moment(this.begins).format('H');
});

// virtual for minute
ShowSchema
  .virtual('minute')
  .get(function() {
    return moment(this.begins).format('mm');
});

// virtual for pretty date
ShowSchema
  .virtual('beginsPretty')
  .get(function() {
    var weekdays = ['su', 'ma', 'ti', 'ke', 'to', 'pe', 'la'];
    return weekdays[this.weekday] + ' ' + moment(this.begins).format('D.M.YYYY [klo] H.mm') + ' ' + this.info;
});

// virtual for date
ShowSchema
  .virtual('date')
  .get(function() {
    return moment(this.begins).format('D.M.YYYY');
});

// virtual for time
ShowSchema
  .virtual('time')
  .get(function() {
    return moment(this.begins).format('H.mm');
});

// show virtuals
ShowSchema.set('toJSON', {virtuals: true});

// export model
module.exports = mongoose.model('Show', ShowSchema);