$(document).ready(function() {
  userEvents();
});

function addRow(db) {
  //console.log('Add: ' + db);
  saveButtons(true);
}

function saveRow(db) {
  //console.log('Save: ' +  db);
  saveButtons(false);
}

function cancelRow(db) {
  //console.log('Cancel: ' + db);
  saveButtons(false);
}

function saveButtons(show) {
  if (show) {
    $('.add-row').addClass('hidden');
    $('.save-row, .cancel-row').removeClass('hidden');
  } else {
    $('.add-row').removeClass('hidden');
    $('.save-row, .cancel-row').addClass('hidden');
  }
}

function userEvents() {
  $('.add-row').on('click', function() {
    addRow($(this).attr('data-db'));
  });
  
  $('.save-row').on('click', function() {
    saveRow($(this).attr('data-db'));
  });
  
  $('.cancel-row').on('click', function() {
    cancelRow($(this).attr('data-db'));
  });
}