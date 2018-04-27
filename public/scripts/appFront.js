'use strict';
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
      },
      max: {
        label: 'Varattavissa',
        placeholder: 'Ei rajoitettu',
        unit: 'kpl',
        number: true,
        min: 0
      }
    },
    
    show: {
      begins: {
        label: 'Näytöksen alkamisaika'
      },
      info: {
        label: 'Näytöksen kuvaus (valinnainen)',
        placeholder: 'esim. Ensi-ilta'
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
      },
      enable: {
        label: 'Ota vastaan varauksia',
        default: true
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
      },
      marketingPermission: {
        label: 'Markkinointilupa',
        default: false
      },
      source: {
        name: {
          dashboard: 'Manuaalinen varaus',
          webForm: 'Nettivaraus'
        }
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
      
      urlView: {
        name: 'url'
      },
      
      order: {
        label: 'Järjestys',
        hidden: true
      },
      
      image: {
        label: 'Kuva',
        type: 'file'
      }
    }
  };
  
  // if data-schema is provided, add content handling functionality
  if ($('.dynamic-content').attr('data-schema')) {
    var schemaOptions = options[$('.dynamic-content').attr('data-schema')];
    resetContent(schemaOptions);
    userEvents(schemaOptions);
    if ($('#filter').length > 0) initFilter();
  } else {
    userEvents( null );
  }
  
  const $dynamic = $('#dynamic');
  
  if ($dynamic.length > 0) {
    const contentOptions = {
      sponsors: {
        formFields: [
          {
            label: 'Nimi',
            slug: 'name',
            element: 'input',
            type: 'text',
            required: true
          },
          {
            label: 'Kuvaus',
            slug: 'description',
            element: 'textarea'
          },
          {
            label: 'Web-osoite',
            slug: 'url',
            element: 'input',
            type: 'url'
          },
          {
            label: 'Kuva',
            info: 'Tiedostomuoto: JPEG tai PNG',
            slug: 'image',
            element: 'input',
            type: 'file',
            accept: 'image/png, image/jpeg',
            preview: true
          }
        ],
        genitive: 'sponsorin',
        previewFields: ['name', 'description', 'urlView'],
        rowType: 'sponsor'
      }
    };
    
    const contentType = $dynamic.attr('data-content');
    const options = contentOptions[contentType];
    
    if (options) {
      const contentObject = Object.create(RowContainer);
      contentObject.init(options);
    }
  }
});

// ================================================================
// OBJECTS
// ================================================================

const Input = {
  create: function(attr, data) {
    const self = this;
    const $label = $('<label>').text(attr.label);
    
    if (attr.info) {
      const $info = $('<div>').addClass('label__info').text(attr.info);
      $label.append($info);
    }
    
    const value = (data) ? data[attr.slug] : '';
    
    const $formField = this.inputElement(attr, value).appendTo($label);
    
    if (attr.element == 'input' && attr.type == 'file') {
      // Add hidden upload url field
      const hiddenSlug = attr.slug + 'Url';
      const hiddenAttr = {
        slug: hiddenSlug,
        element: 'input',
        type: 'hidden'
      };
      
      const hiddenValue = (data) ? data[hiddenSlug] : '';
      const $hiddenField = this.inputElement(hiddenAttr, hiddenValue).appendTo($label);
      var $preview = this.preview(hiddenValue, $formField, $hiddenField);
      
      if (attr.preview === true) {
        $preview.insertBefore($formField);
      }
      
      $formField.change(function fileChanged() {
        $hiddenField.val('');
        $preview.remove();
        
        const file = this.files[0];
        if (file == null) return;
        
        if (attr.accept) {
          const reString = attr.accept.replace(', ', '|');
          const re = new RegExp(reString);
          
          if (!re.test(file.type)) {
            $formField.val('');
            return alert('Virheellinen tiedostomuoto.');
          }
        }
        
        getSignedRequest(file, function fileUploaded(url) {
          $hiddenField.val(url);
          if (attr.preview === true) $preview = self.preview(url, $formField, $hiddenField).insertBefore($formField);
        });
      });
    }
    
    return $label;
  },
  
  inputElement: function(attr, value) {
    const element = attr.element;
    const slug = attr.slug;
    
    const $formField = $('<' + element + '>')
      .addClass('input js-input')
      .attr({
        name: slug
      })
      .prop('required', attr.required);
    
    if (element == 'input') {
      $formField.attr('type', attr.type);
    }
    
    if (attr.class) $formField.addClass(attr.class);
    if (attr.accept) $formField.attr('accept', attr.accept);
    
    if (value && value != '') $formField.val(value);
    
    if (element == 'input' && attr.type == 'url') {
      function addProtocol() {
        const $this = $(this);
        const fieldValue = $this.val();
        if (fieldValue && !/http:\/\/|https:\/\//.test(fieldValue)) {
          $this.val('http://' + fieldValue);
        }
      }
      
      $formField.change(addProtocol);
      addProtocol.call($formField);
    }
    
    return $formField;
  },
  
  preview: function(src, $inputField, $hiddenField) {
    const $preview = $('<div>').addClass('preview');
    
    if (src) {
      const $previewImg = $('<img>')
        .addClass('preview__img')
        .attr('src', src)
        .appendTo($preview);
      const $deleteFile = $('<a>')
        .addClass('delete-file')
        .attr('href', '#')
        .text('Poista')
        .click(function deleteFileClicked(e) {
          e.preventDefault();
          $inputField.val('');
          $hiddenField.val('');
          $preview.remove();
        })
        .appendTo($preview);
    }
    
    return $preview;
  }
};

// Prototype for row methods
const RowContainer = {
  formFields: [],
  genitive: 'rivin',
  previewFields: [],
  rows: {},
  rowType: 'row',
  target: $('#dynamic'),
  
  /**
   * Initialize rows
   * @param options (Object) Row options
   */
  init: function(options) {
    for (var key in options) {
      this[key] = options[key];
    }
    
    this.render();
  },
  
  /** 
   * Add new row
   */
  addNew: function() {
    this.disableButtons();
    this.renderForm(this.target.find('#new-row'), 'data-row');
  },
  
  /** 
   * Cancel edit
   * @param $form (jQuery object) Form that we want to cancel editing
   */
  cancelEdit: function($form) {
    const $row = $form.parent();
    this.hideForm($form);
    
    if ($row.attr('data-id')) {
      // Re-populate row
      this.populateOne($row);
    }
    
    this.enableButtons();
  },
  
  /**
   * Create row
   * @param row (Object) Row data
   * @return (jQuery object) Created row
   */
  createRow: function(row) {
    const id = row._id;
    this.rows[id] = row;
    
    const $row = $('<div>')
      .addClass('data-row')
      .attr('data-id', id);
    
    return this.populateOne($row);
  },
  
  /**
   * Delete row
   * @param $row (jQuery object) Row to be deleted
   * @return (bool) Whether the row was deleted or not
   */
  deleteRow: function($row) {
    const id = $row.attr('data-id');
    
    if (!id) return;
    
    const self = this;
    
    if (confirm('Haluatko varmasti poistaa ' + this.genitive + '?')) {
      const url = document.location.pathname + '/' + id;
      
      // Delete from database
      $.ajax({
        url: url,
        type: 'DELETE'
      }).done(function deleteDone(response) {
        if (response.errors) {
          self.printErrors(response.errors, $row.find('.message'));
          return;
        }

        // Remove from DOM
        $row.remove();
        
        // Delete from local memory
        delete self.rows[id];
      });
    }
  },
  
  /**
   * Disable buttons during editing
   */
  disableButtons: function() {
    this.target.find('.js-disable-in-edit')
      .prop('disabled', true);
  },
  
  /**
   * Edit row
   * @param $row (jQuery object) Row to be edited
   */
  editRow: function($row) {
    this.disableButtons();
    $row.html('');
    this.renderForm($row);
  },
  
  /**
   * Enable buttons after editing
   */
  enableButtons: function() {
    this.target.find('.js-disable-in-edit')
      .prop('disabled', false);
  },
  
  /**
   * Get form id
   * @param $form (jQuery object) Form whose id we want
   * @return (string|null) The id that was retrieved
   */
  formId: function($form) {
    const id = $form.parent().attr('data-id') || null;
    return id;
  },
  
  /**
   * Hide form
   * @param $form (jQuery object) Form to be hidden
   */
  hideForm: function($form) {
    $form.remove();
  },
  
  /**
   * Move row
   * @param $row (jQuery object) Row to move
   * @param direction (String 'up'|'down')
   * @return (Boolean) Whether the row was moved or not
   */
  move: function($row, direction) {
    var $row2;
    
    switch (direction) {
      case 'up':
        $row.prev().insertAfter($row);
        break;
      case 'down':
        $row.next().insertBefore($row);
        break;
      default:
        return false;
    }
    
    this.postOrder();

    return true;
  },
  
  /**
   * Populate one row
   * @param $row (jQuery object) Row to be populated
   * @return (jQuery object) The populated row
   */
  populateOne: function($row) {
    const id = $row.attr('data-id');
    const row = this.rows[id];
    const self = this;
    
    var previewFields = [];

    this.previewFields.forEach(function eachField(field, i) {
      var $field;
      
      if (i === 0) {
        $field = $('<h2>').addClass('data-row__title');
      } else {
        $field = $('<p>').addClass('data-row__field');
      }
      
      $field.text(row[field]);
      previewFields.push($field);
    });
        
    const $editButton = $('<button>')
      .addClass('btn btn--primary js-disable-in-edit')
      .text('Muokkaa')
      .click(function editButtonClicked() {
        self.editRow($row);
      });
    
    const $deleteButton = $('<button>')
      .addClass('btn btn--danger js-disable-in-edit')
      .text('Poista')
      .click(function deleteButtonClicked() {
        self.deleteRow($row);
      });
      
    const $upButton = $('<button>')
      .addClass('btn btn--secondary js-disable-in-edit')
      .text('Nosta')
      .click(function upButtonClicked() {
        self.move($row, 'up');
      });
      
    const $downButton = $('<button>')
      .addClass('btn btn--secondary js-disable-in-edit')
      .text('Laske')
      .click(function downButtonClicked() {
        self.move($row, 'down');
      });
    
    const $message = $('<div>')
      .addClass('message');
    
    $row.append(
      previewFields,
      $editButton,
      $deleteButton,
      $upButton,
      $downButton,
      $message
    );
    
    return $row;
  },
  
  /**
   * Populate all rows
   */
  populateRows: function() {
    this.rows = {};
    const url = document.location.pathname + '/json';
    const self = this;
    
    $.getJSON(url, function processData(data) {
      const $rows = self.target.find('#rows');
      $rows.html('');
      
      data.forEach(function eachRow(row) {
        const $row = self.createRow(row);
        
        $rows.append($row);
      });
    });
  },
  
  /**
   * Post row order
   */
  postOrder: function() {
    var order = [];
    
    $('.data-row').each(function eachRow() {
      order.push($(this).attr('data-id'));
    });
    
    var data = {};
    const orderKey = this.rowType + 'Order';
    data[orderKey] = order;
    
    $.post(document.location.pathname + '/order', data)
      .done(function postingDone(response) {
        if (response.errors) {
          alert('Järjestyksen vaihto epäonnistui.');
        }
      });
  },
  
  /**
   * Print errors
   * @param errors (array [{ msg: '...' }, ... ]) Errors to be printed
   * @param $target (jQuery object) Where the errors will be printed
   * @param append (bool) Append after existing content (default: false)
   */
  printErrors: function(errors, $target, append) {
    if (!append) {
      $target.html('');
    }
    
    errors.forEach(function eachError(error) {
      $messageContent = $('<div>')
        .addClass('message__content message__content--error')
        .text(error.msg);
        
      $target.append($messageContent);
    });
  },
  
  /**
   * Render dynamic elements
   */
  render: function() {
    const self = this;
    const $addNewButton = $('<button>')
      .addClass('btn btn--primary btn--add-new js-disable-in-edit')
      .text('Lisää uusi')
      .click(function addNewRowClicked() {
        self.addNew();
      });
      
    const $newRow = $('<div>')
      .attr('id', 'new-row');
    
    const $rows = $('<div>')
      .addClass('data-rows')
      .attr('id', 'rows');

    this.target.append($addNewButton, $newRow, $rows);
    this.populateRows();
  },
  
  /**
   * Render form
   * @param $target (jQuery object) Where the form will be rendered
   * @param customClass (optional string) Custom class for the form
   */
  renderForm: function($target, customClass) {
    customClass = customClass || '';
    const self = this;
    const $form = $('<form>')
      .addClass('form form--' + self.rowType)
      .addClass(customClass)
      .attr({
        method: 'POST',
        action: ''
      })
      .submit(function submitForm(e) {
        e.preventDefault();
        self.submitForm($(this));
      });
    
    this.formFields.forEach(function eachFormField(field) {
      const id = $target.attr('data-id');
      const name = field.slug;
      const data = (id) ? self.rows[id] : null;
      const $formField = Input.create(field, data);

      $form.append($formField);
    });
    
    const $submitButton = $('<button>')
      .addClass('btn btn--primary')
      .attr('type', 'submit')
      .text('Tallenna');
    
    const $cancelButton = $('<button>')
      .addClass('btn btn--secondary')
      .attr('type', 'reset')
      .click(function cancel() {
        self.cancelEdit($form);
      })
      .text('Peruuta');
    
    const $message = $('<div>').addClass('message');
    
    $form.append($submitButton, $cancelButton, $message).appendTo($target);
  },
  
  /**
   * Submit form
   */
  submitForm: function($form) {
    const url = $form.attr('action');
    var data = {};
    const self = this;
    
    $form.find('.js-input').each(function eachInput() {
      const $field = $(this);
      
      if ($field.attr('type') === 'file') return;
      
      const name = $field.attr('name');
      const value = $field.val();
      data[name] = value;
    });
    
    const id = this.formId($form);
    const isNew = !id;
    
    if (!isNew) {
      // We're editing an existing row, so include the id
      data._id = id;
    }
    
    const posting = $.post(url, data);
    
    posting.done(function postingDone(response) {
      if (response.errors) {
        return printMessage(response.errors, 'error', $form.find('.message'));
      }
      
      const row = response.data;
      self.rows[row._id] = row;
      
      self.cancelEdit($form);
      
      if (isNew) {
        const $newRow = self.createRow(row);
        self.target.find('#rows').prepend($newRow);
        self.postOrder();
      }
    });
  }
};

// ================================================================
// INITIAL FUNCTIONS ==============================================
// ================================================================

// reset content to its initial view
function resetContent(schemaOptions) {
  // create new row div and buttons
  var newRowHtml = '<div class="fields"></div>';
  var addNewHtml = '<button id="add-new" class="edit-row btn btn--primary" type="button" data-row-id="newRow">Lisää uusi</button>';
  
  newRowHtml += '<button class="save-row btn btn--primary hidden" type="button">Tallenna</button>';
  newRowHtml += '<button class="cancel-row btn btn--secondary hidden" type="button">Peruuta</button>';
  newRowHtml += '<div class="errors"></div>';
  
  $( '#add-new' ).remove();
  $( '#content-actions' ).prepend( addNewHtml );
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
    var columns = $('.dynamic-content').attr('data-columns-view').split(' ');
    var allRows = '';
    var schema = $('.dynamic-content').attr('data-schema');
    $( '.data-rows' ).html( '' );
    
    data.forEach(function(item) {
      var $dataRow = $( '<div>' )
        .addClass( 'data-row' )
        .attr( 'id', item._id );
      
      var $fields = $( '<div>' ).addClass( 'fields' );
      
      columns.forEach(function(column) {
        var $column;
        
        // show
        if (column === 'show') {
          const showText = (item.show !== null) ? item.show.beginsPretty : 'POISTETTU NÄYTÖS';
          $column = $( '<div>' ).addClass( 'show' ).text( showText );
        
        // tickets
        } else if (column === 'tickets') {
          const price = item.total.priceString;
          const amount = item.total.tickets;
          const unit = (amount == 1) ? 'lippu' : 'lippua';
          const columnText = amount + ' ' + unit + ', ' + price;
          $column = $('<div>').addClass('tickets').text(columnText);
        
        } else if (column == 'max') {
          if (item.max) $column = $('<div>').text('Varattavissa ' + item.max + ' kpl');
        
        // source
        } else if ( column == 'source' ) {
          var sourceName = schemaOptions.source.name[item.source] || 'Tuntematon lähde';
          $column = $( '<span>' )
            .addClass( 'source' )
            .attr( 'title', sourceName )
            .click( function showTooltip(e) {
              e.stopPropagation();
              $( '.tooltip' ).remove();
              var tooltipHtml = '<b class="source-name">' + sourceName + '</b><br>';
              tooltipHtml += 'Lisätty: ' + item.addedPretty;
              tooltipHtml += ( item.edited ) ? '<br>Muokattu: ' + item.editedPretty : '';
              //console.log(tooltipHtml);
              var $tooltip = $( '<div>' )
                .addClass( 'tooltip' )
                .html( tooltipHtml )
                .prependTo( $( '#' + item._id ) );
              $( '.page' ).click( function pageClicked() {
                $( '.tooltip' ).remove();
                $( this ).off( 'click' );
              } );
            } );
          
          switch ( item.source ) {
            case 'dashboard':
              $column.html( '<i class="fas fa-pencil-alt"></i>' );
              break;
            case 'webForm':
              $column.html( '<i class="fas fa-desktop"></i>' );
              break;
            default:
              $column.html( '<i class="fas fa-question"></i>' );
          }
          
        // everything else
        } else if(item[column] !== undefined) {
          var propertyName = (schemaOptions[column] && schemaOptions[column].name) ? schemaOptions[column].name : column;
          
          $column = $( '<div>' )
            .addClass( column )
            .attr( 'data-property', propertyName )
            .text( item[column] );
          
          if ( schemaOptions[column] && schemaOptions[column].hidden ) {
            $column.addClass( 'hidden' );
          }
        }
        
        $fields.append( $column );
      });

      var buttons = '';
      
      buttons += '<button class="edit-row btn btn--primary" type="button" data-row-id="' + item._id + '">Muokkaa</button>';
      buttons += '<button class="delete-row btn btn--danger" type="button">Poista</button>';
      
      if (schema == 'sponsor') {
        buttons += '<button class="move-up btn btn--secondary" type="button">Nosta</button>';
        buttons += '<button class="move-down btn btn--secondary" type="button">Laske</button>';
      }
      
      buttons += '<button class="save-row btn btn--primary hidden" type="button">Tallenna</button>';
      buttons += '<button class="cancel-row btn btn--secondary hidden" type="button">Peruuta</button>';
      buttons += '<div class="errors"></div>';
      
      $dataRow.append( $fields ).append( buttons );
      
      $( '.data-rows' ).append( $dataRow );
    });
  });
}

// initialize filter
function initFilter() {
  $.getJSON('/app/naytokset/json', function(shows) {
    populateSelect($('#filter')[0], null, shows, true);
  });
}

// add listeners to user events
function userEvents(schemaOptions) {  
  $( '#nav-toggler' ).click( function navTogglerClicked() {
    $( '#nav' ).slideToggle();
  } );
  
  $('.dynamic-content').on('click', '.edit-row', function() {
    editRow($(this).attr('data-row-id'), schemaOptions, true);
  });
  
  $('.dynamic-content').on('click', '.delete-row', function() {
    deleteRow($(this).parent().attr('id'), schemaOptions);
  });
  
  $('.dynamic-content').on('click', '.save-row', function() {
    saveEdit($(this).parent().attr('id'), schemaOptions, cancelEdit);
  });
  
  $('.dynamic-content').on('click', '.cancel-row', function() {
    cancelEdit($(this).parent().attr('id'), schemaOptions);
  });
  
  $('#keyword').on('input', function() {
    populateRows(schemaOptions);
  });
  
  $('#filter').on('change', function() {
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
  
  $('.dynamic-content').on('click', '.move-up', function() {
    moveUp( $( this ).parent(), schemaOptions );
  });
  
  $('.dynamic-content').on('click', '.move-down', function() {
    moveDown( $( this ).parent(), schemaOptions );
  });
  
  $( '#changePassword' ).submit( function passwordChangeSubmitted(evt) {
    evt.preventDefault();
    changePassword.call( this );
  } );
  
  $('#settings').submit(function settingsSubmitted(evt) {
    evt.preventDefault();
    saveSettings.call(this);
  });
}

// ================================================================
// USER EVENT FUNCTIONS ===========================================
// ================================================================

function getSignedRequest(file, callback) {
  const url = document.location.pathname + '/sign-s3?fileName=' + encodeURIComponent(file.name) + '&fileType=' + encodeURIComponent(file.type);
  
  console.log(url);
  
  $.get(url, function success(data, status, xhr) {
    if (xhr.status !== 200) {
      console.log(xhr);
      return alert('Tiedoston latauksessa tapahtui virhe (getSignedRequest), yritä uudelleen.');
    }
    
    const response = JSON.parse(data);
    
    if (response.error) return alert(response.error);
    
    uploadFileXhr(file, response.signedRequest, response.url, callback);
  });
}

function uploadFileXhr(file, signedRequest, url, callback) {
  const xhr = new XMLHttpRequest();
  xhr.open('PUT', signedRequest);
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        if (callback) callback(url);
      } else {
        console.log(xhr);
        alert('Tiedoston latauksessa tapahtui virhe (uploadFile), yritä uudelleen.');
      }
    }
  };
  xhr.send(file);
}

// create form for new or edited row
function editRow(id, schemaOptions, showPast) {
  var row = $('#' + id);
  row.addClass( 'data-row--edit' );
  
  var showSaveAndCancelButtons = function() {
    row.children('.save-row, .cancel-row').removeClass('hidden');
    row.children('.edit-row, .delete-row, .move-up, .move-down').addClass('hidden');
  }

  $('.edit-row, .add-row, .delete-row, .move-up, .move-down').prop('disabled', true);
  $('.errors').html('');
  
  switch (id) {
    case 'newRow':
      // show new form with no existing data
      showForm(id, null, schemaOptions, 'new', showPast, showSaveAndCancelButtons);
      $( '#newRow' ).removeClass( 'hidden' );
      break;
    default:
      // populate row with its data
      $.getJSON(document.location.pathname + '/' + id, function(data) {
        showForm(id, data, schemaOptions, 'edited', showPast, showSaveAndCancelButtons);
      });
  }  
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
        $('#' + id + ' .errors').html( '<div class="message__content message__content--error">' + errors + '</div>' );
      }
    });
  }
}

// cancel editing row
function cancelEdit(id, schemaOptions, data) {
  $( '.data-row' ).removeClass( 'data-row--edit' );
  resetContent(schemaOptions);
  $('.errors').html('');
  $('.add-row').prop('disabled', false);
  $( '#newRow' ).addClass( 'hidden' );
  //if ( id ) scrollTo( id );
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
      $row1.find( '.errors' ).html( '<div class="message__content message__content--error">' + errorString + '</div>' );
    } else {
      cancelEdit( null, schemaOptions );
    }
  } );
}

// save settings
function saveSettings() {
  const $form = $(this);
  const url = $form.attr('action');
  
  var data = {};
  
  $form.find('input').each(function eachField() {
    const $field = $(this);
    data[$field.attr('name')] = $field.val();
  });
  
  $.post(url, data).done(function postingDone(result) {
    const $messageArea = $form.find('.message');

    if (result.errors) {
      printMessage(result.errors, 'error', $messageArea);
    } else {
      printMessage('Asetukset on tallennettu.', 'success', $messageArea);
    }
  });
  
}

// change password
function changePassword() {
  var $form = $( this );
  var url = $form.attr( 'action' );
  
  var posting = $.post( url, {
    oldPassword: $form.find( 'input[name="oldPassword"]' ).val(),
    newPassword: $form.find( 'input[name="newPassword"]' ).val(),
    retypeNewPassword: $form.find( 'input[name="retypeNewPassword"]' ).val(),
  } );
  
  posting.done( function postingDone( data ) {
    if (data.errors) {
      var errors = '';
      data.errors.forEach(function(error) {
        errors += error.msg + '<br>';
      });
      $form.parent().find( '.message' ).html( '<div class="message__content message__content--error">' + errors + '</div>' );
    } else {
      $form.parent().find( '.message' ).html( '<div class="message__content message__content--success">' + data.message + '</div>' );
      $form.find( 'input' ).val( '' );
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

// scroll to id
function scrollTo(id) {
  var $target = $( '#' + id );
  var offset = $target.offset().top;
  //console.log( offset );
  
  $('html, body').scrollTop( offset );
}