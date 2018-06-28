// ===================================================================
// GLOBAL FUNCTIONS ==================================================
// ===================================================================
'use strict';
const REMAINING_THRESHOLD = 50;

// create and show form
function showForm(id, data, schemaOptions, idPrefix, showPast, callback) {  
  var fieldHtml = '';
  var columns = $('.dynamic-content').attr('data-columns-edit').split(' ');
  var jsonUrl = '/' + $('.dynamic-content').attr('data-theatre') + '.json';
  
  var $form = $('<form>')
    .attr({
      method: 'POST',
      action: ''
    });
  
  var $fieldsDiv = $('<div>').addClass('fields');
  
  $.getJSON(jsonUrl, function(theatre) {
    columns.forEach(function(column) {
      var formGroup;
      
      // add ticket class number inputs
      if (column === 'ticketClasses') {
        formGroup = createTicketClassGroup(data, schemaOptions, theatre.ticketClasses, idPrefix);
        
      // add show select
      } else if (column === 'show') {
        formGroup = createShowGroup(data, schemaOptions, idPrefix, theatre.shows, showPast);
      
      // add checkbox
      } else if ( column == 'marketingPermission' || column == 'enable' || column == 'bypassCounter' ) {
        formGroup = createCheckboxGroup( data, schemaOptions, idPrefix, column );
      
      // add image
      } else if (column == 'image') {
        formGroup = createImageGroup(data, schemaOptions, idPrefix, column);
      
      // add text input
      } else {
        formGroup = createTextGroup(data, schemaOptions, idPrefix, column);
      }
      
      if (formGroup[0] !== '') $fieldsDiv.append(formGroup[0]);
      $fieldsDiv.append(formGroup[1]);
    });
    
    //var $errors = $( '<div>' ).addClass( 'errors' );
    $form.html($fieldsDiv);

    $('#' + id + ' > .fields')
      .replaceWith($form);
      //.append( $errors );
    
    updateRemaining();
    
    if ( callback ) callback(id);
  });
}

// create form group for ticket classes
function createTicketClassGroup(data, schemaOptions, ticketClasses, idPrefix) {
  var $ticketClassesDiv = $('<div>').addClass('ticket-classes');
  
  ticketClasses.forEach(function(ticketClass, index) {
    var inputId = idPrefix + 'TicketClass_' + ticketClass._id;
    
    var $formGroupDiv = $('<div>').addClass('input-group');
    
    const $remainingAmount = $('<span>')
      .addClass('remaining__amount')
      .attr('data-id', ticketClass._id);
    
    const $remaining = $('<div>')
      .addClass('remaining')
      .append('Jäljellä: ', $remainingAmount, ' kpl');
    
    var $ticketClassLabel = $('<label>')
      .attr('for', inputId)
      .text(ticketClass.fullName);
    
    if (!ticketClass.bypassCounter) {
      $ticketClassLabel.append($remaining);
    }

    var $numberField;
    
    if (schemaOptions.tickets.input) {
      var ticketIndex = -1;
      if (data) {
        ticketIndex = data.tickets.findIndex(function(ticket) {
          return ticketClass._id == ticket.ticketClass._id;
        });
      }

      const originalAmount = (ticketIndex != -1) ? data.tickets[ticketIndex].amount : 0;
      
      $numberField = $('<input>')
        .addClass('edited-field input input--narrow js-ticket-input')
        .attr({
          type: 'number',
          min: 0,
          name: inputId
        })
        .val(originalAmount)
        .attr('data-original-amount', originalAmount)
        .on('input', function numberFieldInput() {
          updateRemaining(true);
        });

      if (ticketClass.bypassCounter) {
        $numberField.addClass('js-bypass-counter');
      }

    } else {
      $numberField = $('<select>')
        .addClass('edited-field input input--narrow js-ticket-input');
      
      for (var i = 0; i <= 10; i++) {
        var numberOption = document.createElement('option');
        numberOption.value = i;
        numberOption.text = i;
        $numberField.append(numberOption);
      }
    }
    
    $numberField.attr('id', inputId);
 
    var unitSpan = document.createElement('span');
    unitSpan.className = 'unit input-group-addon';
    unitSpan.textContent = 'kpl';
    
    $formGroupDiv.append($numberField, unitSpan);
    
    $ticketClassesDiv.append($ticketClassLabel, $formGroupDiv);
  });
  
  return ['', $ticketClassesDiv];
}

// create form group for text input
function createTextGroup(data, schemaOptions, idPrefix, column) {
  var placeholder = schemaOptions[column].placeholder;
  var unit = schemaOptions[column].unit; 
  var inputId = idPrefix + capital(column);
  
  var textDiv = $('<div>');
  
  var textLabel = $('<label>')
    .attr('for', inputId)
    .text(schemaOptions[column].label);
  
  var textInput;
  
  if (schemaOptions[column].textArea) {
    textInput = $('<textarea>');
  } else {
    textInput = $('<input>')
      .attr('type', 'text');
  }
  
  if (schemaOptions[column].number) {
    textInput.attr('type', 'number');
    
    if (schemaOptions[column].min !== undefined) {
      textInput.attr('min', schemaOptions[column].min);
    }
  }

  textInput.addClass('edited-field input')
    .attr({
      id: inputId,
      placeholder: (placeholder) ? placeholder : '',
    })
    .val((data) ? data[column] : '');
  
  if (schemaOptions[column].required) {
    textInput.prop('required', true);
  }
  
  if (schemaOptions[column].hidden) {
    textInput.attr('type', 'hidden');
    textLabel = '';
    textDiv.append(textInput);
  } else if (unit) {
    var unitSpan = $('<span>')
      .addClass('unit input-group-addon')
      .text((unit) ? unit : '');
    
    textDiv.addClass('input-group');
    textInput.addClass('input--narrow');
    textDiv.append(textInput, unitSpan);
  } else {
    textDiv.addClass('form-group');
    textDiv.append(textLabel, textInput);
    textLabel = '';
  }
  
  return [textLabel, textDiv];
}

// create form group for checkbox
function createCheckboxGroup(data, schemaOptions, idPrefix, column) {
  var checkboxId = idPrefix + capital( column );
  
  var checkboxDiv = document.createElement('div');
  checkboxDiv.className = 'form-group form-group--checkboxes';

  var checkboxLabel = document.createElement( 'label' );
  checkboxLabel.className = 'form__label';
  checkboxLabel.setAttribute( 'for', checkboxId );
  checkboxLabel.textContent = schemaOptions[column].label;
  
  var checkbox = document.createElement( 'input' );
  checkbox.type = 'checkbox';
  checkbox.className = 'edited-field checkbox';
  checkbox.id = checkboxId;
  checkbox.checked = data ? data[column] : schemaOptions[column].default;
  
  checkboxDiv.appendChild( checkbox );
  checkboxDiv.appendChild( checkboxLabel );
  
  return ['', checkboxDiv];
}

// create form group for image
function createImageGroup(data, schemaOptions, idPrefix, column) {
  const inputId = idPrefix + capital(column);
  const columnOptions = schemaOptions[column];
  
  const $imageGroup = $('<div>').addClass('form-group');
  const $imageLabel = $('<label>').text(columnOptions.label);
  
  const $input = $('<input>')
    .addClass('edited-field input')
    .attr({
      id: inputId,
      type: 'file',
      accept: 'image/*'
    });
  
  $imageLabel.append($input).appendTo($imageGroup);
  
  return ['', $imageGroup];
}

// create form group for show
function createShowGroup(data, schemaOptions, idPrefix, shows, showPast) {
  var selectId = idPrefix + 'Show';
  
  var showDiv = $('<div>')
    .addClass('form-group');
  
  var showLabel = $('<label>')
    .attr('for', selectId)
    .text(schemaOptions.show.label);
  
  var showSelect = $('<select>')
    .addClass('edited-field show-select input')
    .attr('id', selectId)
    .change(function showSelectChanged() {
      updateRemaining(true);
    });
  
  showSelect = populateSelect(showSelect, data, shows, showPast);
  
  showDiv.append(showLabel);
  showDiv.append(showSelect);
  
  return ['', showDiv];
}

// populate select item with shows
function populateSelect(node, data, shows, showPast) {
  shows.forEach(function(show) {
    var isPast = new Date() > Date.parse( show.begins );
    var optionObject = $('<option>')
      .val(show._id)
      .attr('data-remaining', JSON.stringify(show.remaining))
      .text(show.beginsPretty);
    
    if ( ( isPast || ! show.enable ) && ! showPast ) {
      optionObject.prop('disabled', true);
    }
    
    node.append(optionObject);
  });
  //console.log( data );
  if (data) {
    node.val(data.show._id);
  }
  
  return node;
}

// update remaining counter
function updateRemaining(allowOver) {
  $('.remaining__amount').each(function eachTicketClass() {
    const $this = $(this);
    const id = $this.attr('data-id');
    const remaining = getRemaining(id);
    
    $this.text(remaining);
    
    if (remaining <= REMAINING_THRESHOLD) {
      $this.parent().addClass('remaining--visible');
    } else {
      $this.parent().removeClass('remaining--visible');
    }
    
    if (!allowOver) setMaxTickets(id);
  });
}

// get remaining ticket amount
function getRemaining(id) {
  const remainingAtLoad = getRemainingAtLoad();
  var remainingId = Infinity;
  
  if (id && remainingAtLoad[id]) {
    const $ticketField = $('.js-ticket-input[name$="icketClass_' + id + '"]');
    const userInput = $ticketField.val();
    remainingId = remainingAtLoad[id] - userInput;
  }
  
  const remainingTotal = remainingAtLoad.total - getUserTickets();
  
  return (remainingId < remainingTotal) ? remainingId : remainingTotal;
}

// get remaining at load-time
function getRemainingAtLoad() {
  const $showSelect = $('select[id$=Show]');
  const $selectedOption = $showSelect.children('option[value="' + $showSelect.val() + '"]');
  const remaining = JSON.parse($selectedOption.attr('data-remaining'));
  
  for (let key in remaining) {
    if (remaining[key] === null) remaining[key] = Infinity;
  }

  return remaining;
}

// set max ticket amount
function setMaxTickets(id) {
  $('.ticket-classes').find('input[name="ticketClass_' + id + '"]').each(function eachTicketField() {
    const maxValue = getRemaining(id) + +$(this).val();
    $(this).attr('max', maxValue);
  });
}

// get user tickets
function getUserTickets() {
  var userTickets = 0;
  
  $('.ticket-classes').find('input, select').each(function eachTicketField() {
    const $this = $(this);

    if ($this.hasClass('js-bypass-counter')) return;
    const originalAmount = +$this.attr('data-original-amount') || 0;
    userTickets += +$this.val() - originalAmount;
  });
  
  return userTickets;
}

// capitalize first letter of string
function capital(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// save row to database
function saveEdit(id, schemaOptions, callback, url) {
  var newData = {};
  var ajaxType = 'PUT';
  var ajaxUrl = document.location.pathname + '/' + id;
  var schema = $('.dynamic-content').attr('data-schema');
  
  // if new row, AJAX type and url are different
  if (id === 'newRow') {
    ajaxType = 'POST';
    ajaxUrl = '';
  }
  
  if (url) ajaxUrl = url;
  
  $('#' + id + ' .edited-field').each(function() {
    var value;
    
    if ( $( this ).hasClass( 'checkbox' ) ) {
      value = $( this ).prop( 'checked' );
    } else {
      value = $( this ).val();
    }
    
    newData[$(this).attr('id')] = value;
  });
  
  if (typeof grecaptcha != 'undefined') {
    newData.recaptchaResponse = grecaptcha.getResponse();
  }
  
  $.ajax({
    type: ajaxType,
    data: newData,
    url: ajaxUrl,
    dataType: 'JSON'
  }).done(function(response) {
    if (response.errors.length === 0) {
      callback(id, schemaOptions, response.data);
    } else {
      var errors = '';
      response.errors.forEach(function(error) {
        errors += error.msg + '<br>';
      });
      $('#' + id + ' .errors').html( '<div class="message__content message__content--error">' + errors + '</div>');
    }
  });
}

( function detectContactSubmit() {
  $( '#contactForm' ).submit( function formSubmitted(evt) {
    evt.preventDefault();
    //submitForm.call( this );
  } );
} )();

function submitForm(token) {
  var $form = $( '#contactForm' );
  var url = $form.attr( 'action' );
  
  var posting = $.post( url, {
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
}

function printMessage(message, type, $target) {
  var formattedMessage = '';
  
  if (Array.isArray(message)) {
    message.forEach(function(item) {
      formattedMessage += item.msg + '<br>';
    });
  } else if (typeof message == 'object') {
    formattedMessage = 'Virhe: "' + message.message + '". Kopioi tämä viesti ja ota yhteyttä tukeen.';
  } else {
    formattedMessage = message;
  }
  
  const $message = $('<div>')
    .addClass('message__content message__content--' + type)
    .html(formattedMessage);
  
  $target.html($message);
}