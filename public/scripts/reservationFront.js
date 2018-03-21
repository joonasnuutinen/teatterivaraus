var schemaOptions = {
  lastName: {
    label: 'Sukunimi'
  },
  firstName: {
    label: 'Etunimi'
  },
  email: {
    label: 'Sähköposti'
  },
  phone: {
    label: 'Puhelin (valinnainen)'
  },
  show: {
    label: 'Näytös'
  },
  additionalInfo: {
    label: 'Lisätietoja (valinnainen)',
    textArea: true
  },
  tickets: {
    unit: 'kpl',
    input: false
  },
  marketingPermission: {
    label: 'Teatteri saa lähettää minulle sähköpostia tulevista esityksistä.'
  }
};

$(function() {
  //userEvents();
  resetView();
});

function resetView() {
  $('#newRow').html('<div class="fields"></div>');
  $('#newRow').append('<button class="save-row btn btn--primary btn--big g-recaptcha" type="button" data-sitekey="6Ld42E0UAAAAAK7uUS51VAeR0Zl0e7K1WffdTi-J" data-callback="sendReservation">Varaa</button>');
  $( '#newRow' ).append( '<div class="errors"></div>' );
  showForm('newRow', null, schemaOptions, 'new' );
}

// user events
function userEvents(schemaOptions) {
  $('#newRow').on('click', '.save-row', function() {
    saveEdit('newRow', schemaOptions, success);
  });
}

function sendReservation() {
  saveEdit('newRow', schemaOptions, success);
  grecaptcha.reset();
}

function success(id, schemaOptions, data) {
  $('.errors').html('');
  
  var successHtml = '<p class="message__content message__content--success">Varaus onnistui! Olemme lähettäneet varausvahvistuksen osoitteeseen <b>' + data.email + '</b>.</p>';
  
  $('#newRow').html( successHtml );
}