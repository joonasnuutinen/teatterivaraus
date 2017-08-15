// ===================================================================
// GLOBAL FUNCTIONS ==================================================
// ===================================================================

// create and show form
function showForm(id, data, schemaOptions, idPrefix) {  
  var fieldHtml = '';
  var columns = $('.content').attr('data-columns-edit').split(' ');
  var jsonUrl = '/' + $('.content').attr('data-theatre') + '.json';
  
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
        formGroup = createShowGroup(data, schemaOptions, idPrefix, theatre.shows);
      
      // add text input
      } else {
        formGroup = createTextGroup(data, schemaOptions, idPrefix, column);
      }
      
      fieldsDiv.appendChild(formGroup);
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
    formGroupDiv.className = 'form-group';
    
    var ticketClassLabel = document.createElement('label');
    ticketClassLabel.setAttribute('for', inputId);
    ticketClassLabel.textContent = ticketClass.fullName;
    
    var numberField;
    
    if (schemaOptions.tickets.input) {
      numberField = document.createElement('input');
      numberField.setAttribute('type', 'number');
      numberField.min = '0';
      numberField.value = data && data.tickets[index] ? data.tickets[index].amount : '0';
    } else {
      numberField = document.createElement('select');
      
      for (var i = 0; i <= 10; i++) {
        var numberOption = document.createElement('option');
        numberOption.value = i;
        numberOption.text = i;
        numberField.add(numberOption);
      }
    }
    
    numberField.className = 'edited-field';
    numberField.id = inputId;
 
    var unitSpan = document.createElement('span');
    unitSpan.className = 'unit';
    unitSpan.textContent = 'kpl';
    
    formGroupDiv.appendChild(ticketClassLabel);
    formGroupDiv.appendChild(numberField);
    formGroupDiv.appendChild(unitSpan);
    
    ticketClassesDiv.appendChild(formGroupDiv);
  });
  
  return ticketClassesDiv;
}

// create form group for text input
function createTextGroup(data, schemaOptions, idPrefix, column) {
  var placeholder = schemaOptions[column].placeholder;
  var unit = schemaOptions[column].unit;
  var inputId = idPrefix + capital(column);
  
  var textDiv = document.createElement('div');
  textDiv.className = 'form-group';
  
  var textLabel = document.createElement('label');
  textLabel.setAttribute('for', inputId);
  textLabel.textContent = schemaOptions[column].label;
  
  var textInput = document.createElement('input');
  textInput.setAttribute('type', 'text');
  textInput.className = 'edited-field';
  textInput.id = inputId;
  textInput.placeholder = placeholder ? placeholder : '';
  textInput.value = data ? data[column] : '';
  
  var unitSpan = document.createElement('span');
  unitSpan.className = 'unit';
  unitSpan.textContent = unit ? unit : '';
  
  textDiv.appendChild(textLabel);
  textDiv.appendChild(textInput);
  textDiv.appendChild(unitSpan);
  
  return textDiv;
}

// create form group for show
function createShowGroup(data, schemaOptions, idPrefix, shows) {
  var selectId = idPrefix + 'Show';
  
  var showDiv = document.createElement('div');
  showDiv.className = 'form-group';
  
  var showLabel = document.createElement('label');
  showLabel.setAttribute('for', selectId);
  showLabel.textContent = schemaOptions.show.label;
  
  var showSelect = document.createElement('select');
  showSelect.className = 'edited-field show-select';
  showSelect.id = selectId;
  
  showSelect = populateSelect(showSelect, data, shows);
  
  showDiv.appendChild(showLabel);
  showDiv.appendChild(showSelect);
  
  return showDiv;
}

// populate select item with shows
function populateSelect(node, data, shows) {
  shows.forEach(function(show) {
    var optionObject = document.createElement('option');
    optionObject.value = show._id;
    optionObject.text = show.beginsPretty;
    node.add(optionObject);
  });
  
  if (data) {
    node.value = data.show;
  }
  
  return node;
}

// capitalize first letter of string
function capital(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// save row to database
function saveEdit(id, schemaOptions, ajaxUrl, callback) {
  var newData = {};
  var ajaxType = 'PUT';
  
  // if new row, AJAX type and url are different
  if (id === 'newRow') {
    ajaxType = 'POST';
    ajaxUrl = '';
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
      callback(id, schemaOptions);
    } else {
      var errors = '';
      response.errors.forEach(function(error) {
        errors += error.msg + '<br>';
      });
      $('.errors').html(errors);
    }
  });
}