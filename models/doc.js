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

// Virtuals
DocSchema.virtual('html').get(function htmlGetter() {
  // Create <p> elements
  const paragraphRE = /(.*[^>])(?:\n{2,}|$)/g;
  var html = this.content.replace(paragraphRE, '<p>$1</p>');
  
  // Remove the rest of the newlines
  return html.replace('\n', '');
});

DocSchema.virtual('slug').get(function slugGetter() {
  return this.title.replace(/ /g, '_');
});

DocSchema.set('timestamps');

// Show virtuals
DocSchema.set('toJSON', {virtuals: true});

// Export model
module.exports = mongoose.model('Doc', DocSchema);