$(function documentReady() {
  $('#reservation-form').submit(function(evt) {
    evt.preventDefault();
    sendReservation($(this));
  });
});

function recaptchaSuccess() {
  $('#submitForm').prop('disabled', false);
}

function recaptchaExpired() {
  $('#submitForm').prop('disabled', true);
}

function sendReservation($form) {
  const url = $form.attr('action');
  
  var data = {};
  
  $form.find('input, select, textarea').each(function eachField() {
    data[$(this).attr('name')] = $(this).val();
  });
  
  console.log(data);
  /*
  var posting = $.post(url, {
    name: $form.find( 'input[name="name"]' ).val(),
    email: $form.find( 'input[name="email"]' ).val(),
    playName: $form.find( 'input[name="playName"]' ).val(),
    beginning: $form.find( 'input[name="beginning"]' ).val(),
    ending: $form.find( 'input[name="ending"]' ).val(),
    additionalInfo: $form.find( 'textarea[name="additionalInfo"]' ).val(),
    recaptchaResponse: grecaptcha.getResponse()
  } );
  
  posting.done( function postingDone( data ) {
    if (data.errors) {
      var errors = '';
      data.errors.forEach(function(error) {
        errors += error.msg + '<br>';
      });
      $( '#message' ).html( '<div class="message__content message__content--error">' + errors + '</div>' );
      grecaptcha.reset();
    } else {
      $( '#message' ).html( '<div class="message__content message__content--success">' + data.message + '</div>' );
      $form.find( 'input' ).val( '' );
      $( '#contactForm' ).slideUp();
    }
  } );
  */
}

function success(id, schemaOptions, data) {
  $('.errors').html('');
  
  var successHtml = '<p class="message__content message__content--success">Varaus onnistui! Olemme lähettäneet varausvahvistuksen osoitteeseen <b>' + data.email + '</b>.</p>';
  
  $('#newRow').html( successHtml );
}