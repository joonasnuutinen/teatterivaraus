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
  // Add new doc
  addNew: function() {
    this.disableButtons();
    this.renderForm(this.target.find('#new-doc'), 'data-row');
  },
  
  // Cancel edit
  cancelEdit: function($form) {
    const $row = $form.parent();
    this.hideForm($form);
    
    if ($row.attr('data-id')) {
      // Re-populate row
      this.populateOne($row);
    }
    
    this.enableButtons();
  },
  
  // Disable buttons during editing
  disableButtons: function() {
    this.target.find('.js-disable-in-edit')
      .prop('disabled', true);
  },
  
  // Edit row
  // $row: Row as jQuery object
  editRow: function($row) {
    this.disableButtons();
    $row.html('');
    this.renderForm($row);
  },
  
  // Enable buttons after editing
  enableButtons: function() {
    this.target.find('.js-disable-in-edit')
      .prop('disabled', false);
  },
  
  // Get form id
  formId: function($form) {
    const id = $form.parent().attr('data-id') || null;
    return id;
  },
  
  // Hide form
  // $form: Form to be hidden
  hideForm: function($form) {
    $form.remove();
  },
  
  // Initialize docs
  // $target: The jQuery object to render docs to
  init: function($target) {
    this.target = $target;
    this.render();
  },
  
  // Populate one row
  // $row: Row to be populated
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
      .text('Poista');
    
    $row.append($title, $editButton, $deleteButton);
  },
  
  // Populate all rows
  populateRows: function() {
    this.docs = {};
    const url = document.location.pathname + '/json';
    const self = this;
    
    $.getJSON(url, function processData(data) {
      data.forEach(function eachDoc(doc) {
        const id = doc._id;
        self.docs[id] = doc;
        
        const $row = $('<div>')
          .addClass('data-row')
          .attr('data-id', id);
        
        self.populateOne($row);
        
        self.target.find('#docs').append($row);
      });
    });
  },
  
  // Render dynamic elements
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
  
  // Render form
  // $target: Where the form will be rendered
  // customClass: Optional custom classes for the form
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
  
  // Submit form
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
    
    if (id) {
      data._id = id;
    }
    
    const posting = $.post(url, data);
    
    posting.done(function postingDone(response) {
      self.docs[id] = data;
      self.cancelEdit($form);
    });
  }
};