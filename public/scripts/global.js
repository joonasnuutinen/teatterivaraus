// ===================================================================
// GLOBAL FUNCTIONS ==================================================
// ===================================================================

// create and show form
function showForm(id, data, schemaOptions, idPrefix, showPast, callback) {  
  var fieldHtml = '';
  var columns = $('.dynamic-content').attr('data-columns-edit').split(' ');
  var jsonUrl = '/' + $('.dynamic-content').attr('data-theatre') + '.json';
  
  var fieldsDiv = document.createElement('div');
  fieldsDiv.className = 'fields';
  
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
      } else if ( column == 'marketingPermission' || column == 'enable' ) {
        formGroup = createCheckboxGroup( data, schemaOptions, idPrefix, column )
      
      // add text input
      } else {
        formGroup = createTextGroup(data, schemaOptions, idPrefix, column);
      }
      
      if (formGroup[0] !== '') fieldsDiv.appendChild(formGroup[0]);
      fieldsDiv.appendChild(formGroup[1]);
    });
    
    //var $errors = $( '<div>' ).addClass( 'errors' );

    $('#' + id + ' > .fields')
      .replaceWith(fieldsDiv)
      //.append( $errors );
    
    if ( callback ) callback();
  });
}

// create form group for ticket classes
function createTicketClassGroup(data, schemaOptions, ticketClasses, idPrefix) {
  var ticketClassesDiv = document.createElement('div');
  ticketClassesDiv.className = 'ticket-classes';
  
  ticketClasses.forEach(function(ticketClass, index) {
    var inputId = idPrefix + 'TicketClass_' + ticketClass._id;
    
    var formGroupDiv = document.createElement('div');
    formGroupDiv.className = 'input-group';
    
    var ticketClassLabel = document.createElement('label');
    ticketClassLabel.setAttribute('for', inputId);
    ticketClassLabel.textContent = ticketClass.fullName;
    
    var numberField;
    
    if (schemaOptions.tickets.input) {
      numberField = document.createElement('input');
      numberField.setAttribute('type', 'number');
      numberField.className = 'edited-field input input--narrow';
      numberField.min = '0';
      numberField.value = data && data.tickets[index] ? data.tickets[index].amount : '0';
    } else {
      numberField = document.createElement('select');
      numberField.className = 'edited-field input input--narrow';
      
      for (var i = 0; i <= 10; i++) {
        var numberOption = document.createElement('option');
        numberOption.value = i;
        numberOption.text = i;
        numberField.add(numberOption);
      }
    }
    
    numberField.id = inputId;
 
    var unitSpan = document.createElement('span');
    unitSpan.className = 'unit input-group-addon';
    unitSpan.textContent = 'kpl';
    
    formGroupDiv.appendChild(numberField);
    formGroupDiv.appendChild(unitSpan);
    
    ticketClassesDiv.appendChild(ticketClassLabel);
    ticketClassesDiv.appendChild(formGroupDiv);
  });
  
  return ['', ticketClassesDiv];
}

// create form group for text input
function createTextGroup(data, schemaOptions, idPrefix, column) {
  var placeholder = schemaOptions[column].placeholder;
  var unit = schemaOptions[column].unit; 
  var inputId = idPrefix + capital(column);
  
  var textDiv = document.createElement('div');
  
  var textLabel = document.createElement('label');
  textLabel.setAttribute('for', inputId);
  textLabel.textContent = schemaOptions[column].label;
  
  var textInput;
  
  if (schemaOptions[column].textArea) {
    textInput = document.createElement('TEXTAREA');
  } else {
    textInput = document.createElement('input');
    textInput.setAttribute('type', 'text');
  }

  textInput.className = 'edited-field input';
  textInput.id = inputId;
  textInput.placeholder = placeholder ? placeholder : '';
  textInput.value = data ? data[column] : '';
  
  if (schemaOptions[column].hidden) {
    textInput.setAttribute('type', 'hidden');
    textLabel = '';
    textDiv.appendChild(textInput);
  } else if (unit) {
    var unitSpan = document.createElement('span');
    unitSpan.className = 'unit input-group-addon';
    unitSpan.textContent = unit ? unit : '';
    textDiv.className = 'input-group';
    textInput.className += ' input--narrow';
    textDiv.appendChild(textInput);
    textDiv.appendChild(unitSpan);
  } else {
    textDiv.className = 'form-group';
    textDiv.appendChild(textLabel);
    textDiv.appendChild(textInput);
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

// create form group for show
function createShowGroup(data, schemaOptions, idPrefix, shows, showPast) {
  var selectId = idPrefix + 'Show';
  
  var showDiv = document.createElement('div');
  showDiv.className = 'form-group';
  
  var showLabel = document.createElement('label');
  showLabel.setAttribute('for', selectId);
  showLabel.textContent = schemaOptions.show.label;
  
  var showSelect = document.createElement('select');
  showSelect.className = 'edited-field show-select input';
  showSelect.id = selectId;
  
  showSelect = populateSelect(showSelect, data, shows, showPast);
  
  showDiv.appendChild(showLabel);
  showDiv.appendChild(showSelect);
  
  return ['', showDiv];
}

// populate select item with shows
function populateSelect(node, data, shows, showPast) {
  shows.forEach(function(show) {
    var isPast = new Date() > Date.parse( show.begins );
    var optionObject = document.createElement('option');
    optionObject.value = show._id;
    optionObject.text = show.beginsPretty;
    
    if ( ( isPast || ! show.enable ) && ! showPast ) {
      optionObject.disabled = true;
    }
    
    node.add(optionObject);
  });
  //console.log( data );
  if (data) {
    node.value = data.show._id;
  }
  
  return node;
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