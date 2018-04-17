const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var SettingSchema = new Schema({
  docOrder: {
    type: [Schema.Types.ObjectId],
    ref: 'Doc'
  }
});

// Export model
module.exports = mongoose.model('Setting', SettingSchema);