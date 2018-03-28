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
    input: true
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
  $('#newRow').append('<button id="submit" class="save-row btn btn--primary btn--big" type="button">Varaa</button>');
  $( '#newRow' ).append( '<div class="errors"></div>' );
}

// user events
function userEvents(schemaOptions) {
  $('#newRow').on('click', '.save-row', function() {
    saveEdit('newRow', schemaOptions, success);
  });
}

function renderRecaptcha() {
  setTimeout(function checkRecaptcha() {
    if ($('.grecaptcha-badge').length === 0) {
      console.log('Reload reCAPTCHA');
      renderRecaptcha();
    }
  }, 500);
  
  grecaptcha.render('submit', {
    sitekey: '6Ld42E0UAAAAAK7uUS51VAeR0Zl0e7K1WffdTi-J',
    callback: sendReservation
  });

  showForm('newRow', null, schemaOptions, 'new' );
}

function sendReservation() {
  var url = $('.dynamic-content').attr('data-theatre');
  saveEdit('newRow', schemaOptions, success, url);
  grecaptcha.reset();
}

function success(id, schemaOptions, data) {
  $('.errors').html('');
  
  var successHtml = '<p class="message__content message__content--success">Varaus onnistui! Olemme lähettäneet varausvahvistuksen osoitteeseen <b>' + data.email + '</b>.</p>';
  
  $('#newRow').html( successHtml );
}