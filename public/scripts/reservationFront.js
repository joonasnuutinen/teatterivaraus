$(function documentReady() {
  updateRemaining();
  
  $('.js-ticket-input').on('input', updateRemaining);
  
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
    var value;
    
    if ($(this).attr('type') === 'checkbox') {
      value = $(this).prop('checked');
    } else {
      value = $(this).val();
    }
    
    data[$(this).attr('name')] = value;
  });
  
  $.post(url, data).done(function postingDone(response) {
    const $messageDiv = $('.message');

    if (response.errors) {
      printMessage(response.errors, 'error', $messageDiv);
      recaptchaExpired();
    } else {
      const successMessage = 'Varaus onnistui! Olemme lähettäneet varausvahvistuksen osoitteeseen <b>' + response.email + '</b>.';
      printMessage(successMessage, 'success', $messageDiv);
      $form.slideUp();
    }
    
    grecaptcha.reset();
  });
}

function success(id, schemaOptions, data) {
  $('.errors').html('');
  
  var successHtml = '<p class="message__content message__content--success">Varaus onnistui! Olemme lähettäneet varausvahvistuksen osoitteeseen <b>' + data.email + '</b>.</p>';
  
  $('#newRow').html( successHtml );
}