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
        } else if(item[column] !== undefined) {
          allRows += '<div class="' + column;
          allRows += (schemaOptions[column] && schemaOptions[column].hidden) ? ' hidden' : '';
          allRows += '" data-property="' + column + '">' + item[column] + '</div>';
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
    editRow($(this).parent().attr('id'), schemaOptions, true);
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
    moveUp( $( this ).parent(), schemaOptions );
  });
  
  $('.content').on('click', '.move-down', function() {
    moveDown( $( this ).parent(), schemaOptions );
  });
}

// ================================================================
// USER EVENT FUNCTIONS ===========================================
// ================================================================

// create form for new or edited row
function editRow(id, schemaOptions, showPast) {
  switch (id) {
    case 'newRow':
      // show new form with no existing data
      showForm(id, null, schemaOptions, 'new', showPast);
      break;
    default:
      // populate row with its data
      $.getJSON(document.location.pathname + '/' + id, function(data) {
        showForm(id, data, schemaOptions, 'edited', showPast);
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
function cancelEdit(id, schemaOptions, data) {
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

// move data row up
function moveUp( $currentRow, schemaOptions ) {
  var $previousRow = $( $currentRow[0].previousElementSibling );

  if ( $previousRow.length === 0 ) {
    return;
  }
  
  changeOrder( $currentRow, $previousRow, schemaOptions );
}

// move data row down
function moveDown( $currentRow, schemaOptions ) {
  var $nextRow = $( $currentRow[0].nextElementSibling );

  if ( $nextRow.length === 0 ) {
    return;
  }
  
  changeOrder( $currentRow, $nextRow, schemaOptions );
}

// change order between two rows
function changeOrder( $row1, $row2, schemaOptions ) {
  var row1Data = {};
  var row2Data = {};
  
  $row1.find( '.fields > div' ).each( function() {
    var propertyName = 'edited' + capital( $( this ).attr( 'data-property' ) );
    row1Data[propertyName] = $( this ).text();
  } );
  
  $row2.find( '.fields > div' ).each( function() {
    var propertyName = 'edited' + capital( $( this ).attr( 'data-property' ) );
    row2Data[propertyName] = $( this ).text();
  } );
  
  var newCurrentOrder = row2Data.editedOrder;
  row2Data.editedOrder = row1Data.editedOrder;
  row1Data.editedOrder = newCurrentOrder;
  
  var currentAjaxUrl = document.location.pathname + '/' + $row1[0].id;
  var previousAjaxUrl = document.location.pathname + '/' + $row2[0].id;
  
  var errors = [];
  
  $.when(
    $.ajax( {
      type: 'PUT',
      url: currentAjaxUrl,
      data: row1Data,
      dataType: 'JSON',
      success: function(result) {
        errors = errors.concat( result.errors );
      }
    } ),
    
    $.ajax( {
      type: 'PUT',
      url: previousAjaxUrl,
      data: row2Data,
      dataType: 'JSON',
      success: function(result) {
        errors = errors.concat( result.errors );
      }
    } )
  ).then( function() {
    if (errors.length !== 0) {
      var errorString = '';
      errors.forEach(function(error) {
        errorString += error.msg + '<br>';
      });
      $('.errors').html(errorString);
    } else {
      cancelEdit( null, schemaOptions );
    }
  } );
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