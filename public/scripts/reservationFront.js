$(function() {
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
      label: 'Puhelin'
    },
    show: {
      label: 'Näytös'
    },
    additionalInfo: {
      label: 'Lisätietoja',
      textArea: true
    },
    tickets: {
      unit: 'kpl',
      input: false
    }
  };
  
  userEvents(schemaOptions);
  resetView(schemaOptions);
});

function resetView(schemaOptions) {
  $('#newRow').html('<div class="fields"></div>');
  $('#newRow').append('<button class="save-row btn btn-primary" type="button">Varaa</button>');
  showForm('newRow', null, schemaOptions, 'new');
}

// user events
function userEvents(schemaOptions) {
  $('#newRow').on('click', '.save-row', function() {
    saveEdit('newRow', schemaOptions, success);
  });
}

function success() {
  $('.errors').html('');
  $('#newRow').html('<p>Varaus onnistui.</p>');
}