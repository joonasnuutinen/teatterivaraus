var mongoose = require('mongoose');
var moment = require('moment');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');

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
  
  enable: {
    type: Boolean,
    default: true
  },
  
  theatre: {
    type: Schema.ObjectId,
    ref: 'Theatre',
    required: true
  }
});

// virtual for weekday
ShowSchema
  .virtual('weekday')
  .get(function() {
    return moment(this.begins).format('d');
});

// virtual for lite date
ShowSchema
  .virtual('beginsLite')
  .get(function() {
    const weekdays = ['su', 'ma', 'ti', 'ke', 'to', 'pe', 'la'];
    return weekdays[this.weekday] + ' ' + moment(this.begins).format('D.M.YYYY [klo] H.mm');
});

// virtual for pretty date
ShowSchema
  .virtual('beginsPretty')
  .get(function() {
    const weekdays = ['su', 'ma', 'ti', 'ke', 'to', 'pe', 'la'];
    return this.beginsLite + ' ' + this.info;
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

// Virtual for isPast
ShowSchema
  .virtual('isPast')
  .get(function() {
    return (new Date() > Date.parse( this.begins ));
});

ShowSchema.plugin(mongooseLeanVirtuals);

// show virtuals
ShowSchema.set('toJSON', { virtuals: true });

// export model
module.exports = mongoose.model('Show', ShowSchema);