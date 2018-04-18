'use strict';

$(function documentReady() {
  const contentObjects = {
    docs: DocContainer
  };
  const $dynamic = $('#dynamic');
  
  const contentType = $dynamic.attr('data-content');
  const contentParent = contentObjects[contentType];
  
  if (!contentParent) return;
  
  const contentObject = Object.create(contentParent);
  
  contentObject.init($dynamic);
});

// Prototype for doc methods
const DocContainer = {
  /** 
   * Add new doc
   */
  addNew: function() {
    this.disableButtons();
    this.renderForm(this.target.find('#new-doc'), 'data-row');
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
  
  deleteFromDatabase: function(id) {
    
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
    
    if (confirm('Haluatko varmasti poistaa ohjeen?')) {
      const url = document.location.pathname + '/' + id;
      
      // Delete from database
      $.ajax({
        url: url,
        type: 'DELETE'
      }).done(function deleteDone(response) {
        if (response.errors) {
          self.printErrors(response.errors, $row);
          return;
        }
        
        // Delete from local memory
        delete self.docs[id];
        
        // Remove from DOM
        $row.remove();
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
   * Initialize docs
   * @param $target (jQuery object) Where to render the docs to
   */
  init: function($target) {
    this.target = $target;
    this.render();
  },
  
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
    
    var order = [];
    
    $('.data-row').each(function eachRow() {
      order.push($(this).attr('data-id'));
    });
    
    $.post(document.location.pathname + '/order', { docOrder: order })
      .done(function postingDone(response) {
        //console.log(response);
      });
    
    return true;
  },
  
  /**
   * Populate one row
   * @param $row (jQuery object) Row to be populated
   */
  populateOne: function($row) {
    const id = $row.attr('data-id');
    const doc = this.docs[id];
    const self = this;
    
    const $title = $('<h2>')
      .addClass('data-row__title')
      .text(doc.title);
        
    const $editButton = $('<button>')
      .addClass('btn btn--primary js-disable-in-edit')
      .text('Muokkaa')
      .click(function editButtonClicked() {
        self.editRow($(this).parent());
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
      $title,
      $editButton,
      $deleteButton,
      $upButton,
      $downButton,
      $message
    );
  },
  
  /**
   * Populate all rows
   */
  populateRows: function() {
    this.docs = {};
    const url = document.location.pathname + '/json';
    const self = this;
    
    $.getJSON(url, function processData(data) {
      const $docs = self.target.find('#docs');
      $docs.html('');
      
      data.forEach(function eachDoc(doc) {
        const id = doc._id;
        self.docs[id] = doc;
        
        const $row = $('<div>')
          .addClass('data-row')
          .attr('data-id', id);
        
        self.populateOne($row);
        
        $docs.append($row);
      });
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
      .click(function addNewDocClicked() {
        self.addNew();
      });
      
    const $newDoc = $('<div>')
      .attr('id', 'new-doc');
    
    const $docs = $('<div>')
      .addClass('data-rows')
      .attr('id', 'docs');
    
    this.target.append($addNewButton, $newDoc, $docs);
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
      .addClass('form form--doc')
      .addClass(customClass)
      .attr({
        method: 'POST',
        action: ''
      })
      .submit(function submitForm(e) {
        e.preventDefault();
        self.submitForm($(this));
      })
    
    const formFields = [
      {
        name: 'Otsikko',
        slug: 'title',
        element: 'input',
        type: 'text',
        required: true
      },
      {
        name: 'Sisältö',
        slug: 'content',
        element: 'textarea',
        class: 'input--tall'
      }
    ];
    
    formFields.forEach(function eachFormField(field) {
      const $label = $('<label>').text(field.name);
      const element = field.element;
      const slug = field.slug;
      
      const $formField = $('<' + element + '>')
        .addClass('input js-input')
        .attr({
          name: slug
        })
        .prop('required', field.required);
      
      if (element == 'input') {
        $formField.attr('type', field.type);
      }
      
      const customClass = field.class;
      
      if (customClass) $formField.addClass(customClass);
      
      const id = $target.attr('data-id');
      
      if (id) $formField.val(self.docs[id][slug]);
      
      $label.append($formField).appendTo($form);
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
    
    $form.append($submitButton, $cancelButton).appendTo($target);
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
      const doc = response.data;
      self.docs[doc._id] = doc;
      
      self.cancelEdit($form);
      
      if (isNew) {
        self.populateRows();
      }
    });
  }
};