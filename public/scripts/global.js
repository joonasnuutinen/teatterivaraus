// ===================================================================
// GLOBAL FUNCTIONS ==================================================
// ===================================================================

// create and show form
function showForm(id, data, schemaOptions, idPrefix, showPast) {  
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
      
      // add text input
      } else {
        formGroup = createTextGroup(data, schemaOptions, idPrefix, column);
      }
      
      if (formGroup[0] !== '') fieldsDiv.appendChild(formGroup[0]);
      fieldsDiv.appendChild(formGroup[1]);
    });

    $('#' + id + ' > .fields')[0].replaceWith(fieldsDiv);
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
      numberField.className = 'edited-field input';
      
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
    if (showPast || new Date() < Date.parse( show.begins )) {
      var optionObject = document.createElement('option');
      optionObject.value = show._id;
      optionObject.text = show.beginsPretty;
      node.add(optionObject);
    }
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
function saveEdit(id, schemaOptions, callback) {
  var newData = {};
  var ajaxType = 'PUT';
  var ajaxUrl = document.location.pathname + '/' + id;
  var schema = $('.dynamic-content').attr('data-schema');
  
  // if new row, AJAX type and url are different
  if (id === 'newRow') {
    ajaxType = 'POST';
    ajaxUrl = '';
  } else if (schema == 'sponsor') {
    
  }
  
  $('#' + id + ' .edited-field').each(function() {
    newData[$(this).attr('id')] = $(this).val();
  });
  
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
      $('.errors').html(errors);
    }
  });
}