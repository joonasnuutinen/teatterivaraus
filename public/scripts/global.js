$(document).ready(function() {
  // options for different schemas
  var options = {
    ticketClass: {
      price: {
        label: 'Lipun hinta',
        unit: '€'
      },
      name: {
        label: 'Lippuluokan nimi',
        placeholder: 'esim. Opiskelijat'
      }
    },
    
    show: {
      begins: {
        label: 'Näytöksen alkamisaika'
      },
      info: {
        label: 'Näytöksen kuvaus (valinnainen)',
        placeholder: 'esim. Valaistu yönäytös'
      },
      year: {
        label: 'Vuosi'
      },
      month: {
        label: 'Kuukausi'
      },
      day: {
        label: 'Päivä'
      },
      hour: {
        label: 'Tunti'
      },
      minute: {
        label: 'Minuutti'
      },
      date: {
        label: 'Esityspäivä',
        placeholder: 'pp.kk.vvvv'
      },
      time: {
        label: 'Kellonaika',
        placeholder: 'hh.mm'
      }
    },
    
    reservation: {
      added: {
        label: 'Lisätty'
      },
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
        label: 'Lisätietoja'
      },
      tickets: {
        unit: 'kpl'
      }
    }
  };
  
  // if data-schema is provided, add content handling functionality
  if ($('.content').attr('data-schema')) {
    var schemaOptions = options[$('.content').attr('data-schema')];
    resetContent(schemaOptions);
    userEvents(schemaOptions);
    initFilter();
  }
});

// ================================================================
// INITIAL FUNCTIONS ==============================================
// ================================================================

// reset content to its initial view
function resetContent(schemaOptions) {
  // create new row div and buttons
  var newRowHtml = '<div class="fields"></div>';
  newRowHtml += '<button class="edit-row">Lisää uusi</button>';
  newRowHtml += '<button class="save-row hidden">Tallenna</button>';
  newRowHtml += '<button class="cancel-row hidden">Peruuta</button>';
  
  $('#newRow').html(newRowHtml);
  
  populateRows(schemaOptions);
}

// populate data
function populateRows(schemaOptions) {
  var params = {
    keyword: $('#keyword').val(),
    show: $('#filter').val()
  };
  var url = createUrl('json', params);
  $.getJSON(url, function(data) {
    var columns = $('.content').attr('data-columns-view').split(' ');
    var allRows = '';
    data.forEach(function(item) {
      allRows += '<div class="row" id="' + item._id + '">';
      allRows += '<div class="fields">';
      
      columns.forEach(function(column) {
        if (column === 'show') {
          allRows += '<div class="show">';
          allRows += (item.show !== null) ? item.show.beginsPretty : 'POISTETTU NÄYTÖS';
          allRows += '</div>';
        } else if (column === 'tickets') {
          var price = item.total.price;
          var amount = item.total.tickets;
          var unit = (amount == 1) ? 'lippu' : 'lippua';
          allRows += '<div class="tickets">' + amount + ' ' + unit + ', ' + price + ' €</div>';
        } else if(item[column]) {
          allRows += '<div class="' + column + '">' + item[column] + '</div>';
        }
        
      });
      
      allRows += '</div>';
      
      allRows += '<button class="edit-row">Muokkaa</button>';
      allRows += '<button class="delete-row">Poista</button>';
      allRows += '<button class="save-row hidden">Tallenna</button>';
      allRows += '<button class="cancel-row hidden">Peruuta</button>';
      allRows += '</div>';
    });
    $('.rows').html(allRows);
  });
}

// initialize filter
function initFilter() {
  populateSelect('#filter');
}

// add listeners to user events
function userEvents(schemaOptions) {  
  $('.content').on('click', '.edit-row', function() {
    editRow($(this).parent().attr('id'), schemaOptions);
  });
  
  $('.content').on('click', '.delete-row', function() {
    deleteRow($(this).parent().attr('id'), schemaOptions);
  });
  
  $('.content').on('click', '.save-row', function() {
    saveEdit($(this).parent().attr('id'), schemaOptions);
  });
  
  $('.content').on('click', '.cancel-row', function() {
    cancelEdit($(this).parent().attr('id'), schemaOptions);
  });
  
  $('#keyword').on('input', function() {
    populateRows(schemaOptions);
  });
  
  $('#filter').on('input', function() {
    var printButton = $('#print');
    if ($(this).val() === '') {
      printButton.addClass('hidden');
    } else {
      printButton.removeClass('hidden');
    }
    populateRows(schemaOptions);
  });
  
  $('#print').on('click', function() {
    printReservations();
  });
}

// ================================================================
// USER EVENT FUNCTIONS ===========================================
// ================================================================

// create form for new or edited row
function editRow(id, schemaOptions) {
  switch (id) {
    case 'newRow':
      // show new form with no existing data
      showForm(id, null, schemaOptions, 'new');
      break;
    default:
      // populate row with its data
      $.getJSON(document.location.pathname + '/' + id, function(data) {
        showForm(id, data, schemaOptions, 'edited');
      });
  }
  
  // hide or disable buttons
  var row = $('#' + id);
  row.children('.save-row, .cancel-row').removeClass('hidden');
  row.children('.edit-row, .delete-row').addClass('hidden');
  $('.edit-row, .add-row, .delete-row').prop('disabled', true);
  $('.errors').html('');
}

// delete row
function deleteRow(id, schemaOptions) {
  $('.errors').html('');
  var confirmation = confirm('Haluatko varmasti poistaa rivin lopullisesti?');
  
  if (confirmation) {
    $.ajax({
      type: 'DELETE',
      url: document.location.pathname + '/' + id
    }).done(function(response) {
      if (response.errors.length === 0) {
        cancelEdit(id, schemaOptions);
      } else {
        var errors = '';
        response.errors.forEach(function(error) {
          errors += error.msg + '<br>';
        });
        $('.errors').html(errors);
      }
    });
  }
}

// save row to database
function saveEdit(id, schemaOptions) {
  var newData = {};
  var ajaxType = 'PUT';
  var ajaxUrl = document.location.pathname + '/' + id;
  
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
      cancelEdit(id, schemaOptions);
    } else {
      var errors = '';
      response.errors.forEach(function(error) {
        errors += error.msg + '<br>';
      });
      $('.errors').html(errors);
    }
  });
}

// cancel editing row
function cancelEdit(id, schemaOptions) {
  resetContent(schemaOptions);
  $('.errors').html('');
  $('.add-row').prop('disabled', false);
}

// print reservations
function printReservations() {
  var selectedShowName = $('#filter')[0].selectedOptions[0].innerText;
  console.log('Printing ' + selectedShowName + '...');
}

// ================================================================
// OTHER FUNCTIONS ================================================
// ================================================================

// create and show form
function showForm(id, data, schemaOptions, idPrefix) {
  var fieldHtml = '';
  var columns = $('.content').attr('data-columns-edit').split(' ');
  
  columns.forEach(function(column) {
    if (column === 'ticketClasses') {
      fieldHtml += '<div class="ticket-classes"></div>';
      $.getJSON('/app/lippujen-hinnat/json', function(ticketClasses) {
        var ticketClassHtml = '';
        ticketClasses.forEach(function(ticketClass, index) {
          var inputId = idPrefix + 'TicketClass_' + ticketClass._id;
          ticketClassHtml += '<div class="form-group">';
          ticketClassHtml += '<label for="' + inputId + '">';
          ticketClassHtml += ticketClass.fullName;
          ticketClassHtml += '</label>';
          ticketClassHtml += '<input type="number" min="0" class="edited-field" id="' + inputId + '" value="';
          
          ticketClassHtml += (data === null) ? '0' : data.tickets[index].amount;
          ticketClassHtml += '"> kpl</div>';
        });
        $('.ticket-classes').html(ticketClassHtml);
      });
    } else if (column === 'show') {
      var selectId = idPrefix + 'Show';
      fieldHtml += '<div class="form-group">';
      fieldHtml += '<label for="' + selectId + '">';
      fieldHtml += schemaOptions.show.label;
      fieldHtml += '</label>';
      fieldHtml += '<select class="edited-field show-select" id="' + selectId + '"></select></div>';
      
      populateSelect('.show-select', data);
    } else {
      var inputId = idPrefix + capital(column);
      fieldHtml += '<div class="form-group">';
      fieldHtml += '<label for="' + inputId + '">';
      fieldHtml += schemaOptions[column].label;
      fieldHtml += '</label>';
      fieldHtml += '<input type="text" class="edited-field" id="' + inputId + '" value="';
      fieldHtml += (data === null) ? '' : data[column];
      fieldHtml += '" placeholder="';
      fieldHtml += (typeof(schemaOptions[column].placeholder) === 'undefined') ? '' : schemaOptions[column].placeholder;
      fieldHtml += '">';
      fieldHtml += (typeof(schemaOptions[column].unit) === 'undefined') ? '' : ' ' + schemaOptions[column].unit;
      fieldHtml += '</div>';
    }
  });
  
  $('#' + id + ' > .fields').html(fieldHtml);
}

// populate select item with shows
function populateSelect(selector, data) {
  $.getJSON('/app/naytokset/json', function(shows) {
    shows.forEach(function(show) {
      var optionObject = document.createElement('option');
      optionObject.setAttribute('value', show._id);
      optionObject.text = show.beginsPretty;
      $(selector)[0].add(optionObject);
    });
    if (data) {
      $(selector)[0].value = data.show;
    }
  });
}

// capitalize first letter of string
function capital(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// create AJAX url
function createUrl(subPath, paramObject) {
  var url = document.location.pathname + '/' + subPath;
  if (paramObject) {
    url += '?';
    for (var param in paramObject) {
      url += param + '=' + paramObject[param] + '&';
    }
  }
  return url;
}