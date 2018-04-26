var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var SponsorSchema = Schema({
  name: {
    type: String,
    required: true
  },
  
  description: {
    type: String
  },
  
  url: {
    type: String
  },
  
  imageUrl: {
    type: String
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

// virtual for url view
SponsorSchema
  .virtual('urlView')
  .get(function() {
    return (this.url) ? filterUrl(this.url).view : null;
});

// virtual for url href
SponsorSchema
  .virtual('urlHref')
  .get(function() {
    return (this.url) ? filterUrl( this.url ).href : null;
});

// show virtuals
SponsorSchema.set('toJSON', {virtuals: true});

// export model
module.exports = mongoose.model('Sponsor', SponsorSchema);

// filter url
function filterUrl(input) {
  if ( ! input ) return null;
  var re = /^(http(?:s)?:\/\/)?(.*)(\/?)$/;
  var urlParts = input.match( re );
  
  var protocol = urlParts[1] || 'http://';
  
  return {
    href: protocol + urlParts[2] + urlParts[3],
    view: urlParts[2]
  };
}