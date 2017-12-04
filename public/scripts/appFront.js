// document ready
$(function() {
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
        label: 'Lisätietoja',
        textArea: true
      },
      tickets: {
        unit: 'kpl',
        input: true
      }
    },
    
    sponsor: {
      name: {
        label: 'Nimi'
      },
      
      description: {
        label: 'Kuvaus',
        textArea: true
      },
      
      url: {
        label: 'Web-osoite'
      },
      
      order: {
        label: 'Järjestys',
        hidden: true
      }
    }
  };
  
  // if data-schema is provided, add content handling functionality
  if ($('.content').attr('data-schema')) {
    var schemaOptions = options[$('.content').attr('data-schema')];
    resetContent(schemaOptions);
    userEvents(schemaOptions);
    if ($('#filter').length > 0) initFilter();
  }
});

// ================================================================
// INITIAL FUNCTIONS ==============================================
// ================================================================

// reset content to its initial view
function resetContent(schemaOptions) {
  // create new row div and buttons
  var newRowHtml = '<div class="fields"></div>';
  newRowHtml += '<button class="edit-row btn btn-primary" type="button">Lisää uusi</button>';
  newRowHtml += '<button class="save-row btn btn-primary hidden" type="button">Tallenna</button>';
  newRowHtml += '<button class="cancel-row btn btn-secondary hidden" type="button">Peruuta</button>';
  
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
    var schema = $('.content').attr('data-schema');
    data.forEach(function(item) {
      allRows += '<div class="data-row" id="' + item._id + '">';
      allRows += '<div class="fields">';
      
      columns.forEach(function(column) {
        if (column === 'show') {
          allRows += '<div class="show">';
          allRows += (item.show !== null) ? item.show.beginsPretty : 'POISTETTU NÄYTÖS';
          allRows += '</div>';
        } else if (column === 'tickets') {
          var price = item.total.priceString;
          var amount = item.total.tickets;
          var unit = (amount == 1) ? 'lippu' : 'lippua';
          allRows += '<div class="tickets">' + amount + ' ' + unit + ', ' + price + '</div>';
        } else if(item[column]) {
          allRows += '<div class="' + column + '">' + item[column] + '</div>';
        }
        
      });
      
      allRows += '</div>';
      
      allRows += '<button class="edit-row btn btn-primary" type="button">Muokkaa</button>';
      allRows += '<button class="delete-row btn btn-danger" type="button">Poista</button>';
      
      if (schema == 'sponsor') {
        allRows += '<button class="move-up btn btn-warning" type="button">Nosta</button>';
        allRows += '<button class="move-down btn btn-warning" type="button">Laske</button>';
      }
      
      allRows += '<button class="save-row btn btn-primary hidden" type="button">Tallenna</button>';
      allRows += '<button class="cancel-row btn btn-secondary hidden" type="button">Peruuta</button>';
      allRows += '</div>';
    });
    $('.data-rows').html(allRows);
  });
}

// initialize filter
function initFilter() {
  $.getJSON('/app/naytokset/json', function(shows) {
    populateSelect($('#filter')[0], null, shows);
  });
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
    saveEdit($(this).parent().attr('id'), schemaOptions, cancelEdit);
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
  
  $('.content').on('click', '.move-up', function() {
    console.log('move up');
  });
  
  $('.content').on('click', '.move-down', function() {
    console.log('move down');
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
  row.children('.edit-row, .delete-row, .move-up, .move-down').addClass('hidden');
  $('.edit-row, .add-row, .delete-row, .move-up, .move-down').prop('disabled', true);
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

// cancel editing row
function cancelEdit(id, schemaOptions) {
  resetContent(schemaOptions);
  $('.errors').html('');
  $('.add-row').prop('disabled', false);
}

// print reservations
function printReservations() {
  var selectedShowId = $('#filter').val();
  var selectedShowName = $('#filter')[0].selectedOptions[0].innerText;
  var printUrl = '/app/varaukset/tulosta/' + selectedShowId;
  window.open(printUrl, '_blank');
}

// ================================================================
// OTHER FUNCTIONS ================================================
// ================================================================

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