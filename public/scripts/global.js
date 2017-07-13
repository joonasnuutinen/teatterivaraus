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
    }
  };
  
  // if data-schema is provided, add content handling functionality
  if ($('.content').attr('data-schema')) {
    var schemaOptions = options[$('.content').attr('data-schema')];
    resetContent(schemaOptions);
    userEvents(schemaOptions);
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
  
  // populate existing data and add edit buttons to rows
  $.getJSON(document.location.pathname + '/json', function(data) {
    var columns = $('.content').attr('data-columns-view').split(' ');
    var allRows = '';
    data.forEach(function(item) {
      allRows += '<div class="row" id="' + item._id + '">';
      allRows += '<div class="fields">';
      
      columns.forEach(function(column) {
        allRows += '<span class="' + column + '">' + item[column] + '</span>';
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

// add listeners to user events
function userEvents(schemaOptions) {  
  $('.content').on('click', '.edit-row', function() {
    editRow($(this).parent().attr('id'), schemaOptions);
  });
  
  $('.content').on('click', '.delete-row', function() {
    deleteRow($(this).parent().attr('id'));
  });
  
  $('.content').on('click', '.save-row', function() {
    saveEdit($(this).parent().attr('id'));
  });
  
  $('.content').on('click', '.cancel-row', function() {
    cancelEdit($(this).parent().attr('id'));
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
}

// delete row
function deleteRow(id) {
  var confirmation = confirm('Haluatko varmasti poistaa tämän lippuluokan?');
  
  if (confirmation) {
    $.ajax({
      type: 'DELETE',
      url: document.location.pathname + '/' + id
    }).done(function(response) {
      if (response.errors.length === 0) {
        resetContent();
      } else {
        $('.errors').html(errors[0].msg);
      }
    });
  }
}

// save row to database
function saveEdit(id) {
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
      cancelEdit(id);
      resetContent();
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
function cancelEdit(id) {
  resetContent();
  $('.errors').html('');
  $('.add-row').prop('disabled', false);
}

// ================================================================
// OTHER FUNCTIONS ================================================
// ================================================================

// create and show form
function showForm(id, data, schemaOptions, idPrefix) {
  var fieldHtml = '';
  var columns = $('.content').attr('data-columns-edit').split(' ');
  
  columns.forEach(function(column) {
    var inputId = idPrefix + capital(column);
    fieldHtml += '<div class="form-group">';
    fieldHtml += '<label for="' + inputId + '">';
    fieldHtml += schemaOptions[column].label;
    fieldHtml += '</label>';
    fieldHtml += '<input type="text" class="edited-field" id="' + inputId + '" value="';
    fieldHtml += (data === null) ? '' : data[column];
    fieldHtml += '" placeholder="';
    fieldHtml += (schemaOptions[column].placeholder === undefined) ? '' : schemaOptions[column].placeholder;
    fieldHtml += '">';
    fieldHtml += (schemaOptions[column].unit === undefined) ? '' : ' ' + schemaOptions[column].unit;
    fieldHtml += '</div>';
  });
  
  $('#' + id + ' > .fields').html(fieldHtml);
}

// capitalize first letter of string
function capital(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}