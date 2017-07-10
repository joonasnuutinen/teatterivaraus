$(document).ready(function() {
  populateRows();
  userEvents();
});

function addRow() {
  showFields(true);
}

function saveRow() {  
  var newRow = {};
  $('.new-field').each(function() {
    newRow[$(this).attr('id')] = $(this).val();
  });
  
  $.ajax({
    type: 'POST',
    data: newRow,
    url: '',
    dataType: 'JSON'
  }).done(function(response) {
    if (response.errors.length === 0) {
      cancelRow();
      populateRows();
    } else {
      var errors = '';
      response.errors.forEach(function(error) {
        errors += error.msg + '<br>';
      });
      $('.errors').html(errors);
    }
  });
}

function cancelRow() {
  $('.new-field').val('');
  $('.errors').html('');
  showFields(false);
}

function deleteRow(id) {
  var confirmation = confirm('Haluatko varmasti poistaa tämän lippuluokan?');
  
  if (confirmation) {
    $.ajax({
      type: 'DELETE',
      url: document.location.pathname + '/' + id
    }).done(function(response) {
      if (response.errors.length === 0) {
        populateRows();
      } else {
        $('.errors').html(errors[0].msg);
      }
    });
  }
}

function showFields(show) {
  if (show) {
    $('.add-row').addClass('hidden');
    $('.save-row, .cancel-row').removeClass('hidden');
    $('.new-fields').removeClass('hidden');
    $('.edit-row, .delete-row').prop('disabled', true);
  } else {
    $('.add-row').removeClass('hidden');
    $('.save-row, .cancel-row').addClass('hidden');
    $('.new-fields').addClass('hidden');
    $('.edit-row, .delete-row').prop('disabled', false);
  }
}

function userEvents() {
  $('.add-row').on('click', function() {
    addRow();
  });
  
  $('.save-row').on('click', function() {
    saveRow();
  });
  
  $('.cancel-row').on('click', function() {
    cancelRow();
  });
  
  $('.rows').on('click', '.edit-row', function() {
    editRow($(this).parent().attr('id'));
  });
  
  $('.rows').on('click', '.delete-row', function() {
    deleteRow($(this).parent().attr('id'));
  });
  
  $('.rows').on('click', '.save-edit', function() {
    saveEdit($(this).parent().attr('id'));
  });
  
  $('.rows').on('click', '.cancel-edit', function() {
    cancelEdit($(this).parent().attr('id'));
  });
}

function populateRows() {
  $.getJSON('lippujen-hinnat/json', function(data) {
    var allRows = '';
    $.each(data, function(key, item) {
      allRows += '<div class="row" id="' + item._id + '">';
      allRows += '<span class="name">' + item.name + '</span>';
      allRows += '<span class="price">' + item.price + '</span> €';
      allRows += '<button class="edit-row">Muokkaa</button>';
      allRows += '<button class="delete-row">Poista</button>';
      allRows += '<button class="save-edit hidden">Tallenna</button>';
      allRows += '<button class="cancel-edit hidden">Peruuta</button>';
      allRows += '</div>';
    });
    $('.rows').html(allRows);
  });
}

function editRow(id) {
  var fieldHtml = '';
  var row = $('#' + id);
  row.children('span').each(function() {
    fieldHtml += '<input type="text" class="edited-field" data-name="' + $(this).attr('class') + '" value="' + $(this).text() + '">';
    $(this).remove();
  });
  
  row.prepend(fieldHtml);
  
  row.children('.save-edit, .cancel-edit').removeClass('hidden');
  row.children('.edit-row, .delete-row').addClass('hidden');
  $('.edit-row, .add-row, .delete-row').prop('disabled', true);
  
}

function saveEdit(id) {
  var editedRow = {};
  $('.edited-field').each(function() {
      editedRow[$(this).attr('data-name')] = $(this).val();
  });
  
  $.ajax({
    type: 'PUT',
    data: editedRow,
    url: document.location.pathname + '/' + id,
    dataType: 'JSON'
  }).done(function(response) {
    if (response.errors.length === 0) {
      cancelRow();
      populateRows();
    } else {
      var errors = '';
      response.errors.forEach(function(error) {
        errors += error.msg + '<br>';
      });
      $('.errors').html(errors);
    }
  });
  
  cancelEdit(id);
}

function cancelEdit(id) {
  populateRows();
  $('.add-row').prop('disabled', false);
}