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
  
  contentObject.init($dynamic)
    .render();
});

const DocContainer = {
  addNew: function() {
    
  },
  
  init: function($target) {
    this.target = $target;
    
    return this;
  },
  
  render: function() {
    const self = this;
    const $addNewButton = $('<button>')
      .addClass('btn btn--primary')
      .text('Lisää uusi')
      .click(function addNewDocClicked() {
        self.renderForm();
      })
      .appendTo(this.target);
    
    return this;
  },
  
  renderForm: function() {
    const self = this;
    const $form = $('<form>')
      .addClass('form')
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
        type: 'text'
      },
      {
        name: 'Sisältö',
        slug: 'content',
        element: 'textarea'
      }
    ];
    
    formFields.forEach(function eachFormField(field) {
      const $label = $('<label>').text(field.name);
      const element = field.element;
      
      const $formField = $('<' + element + '>')
        .addClass('input js-input')
        .attr({
          name: field.slug
        });
      
      if (element == 'input') {
        $formField.attr('type', field.type);
      }
      
      $label.append($formField).appendTo($form);
    });
    
    const $submitButton = $('<button>')
      .addClass('btn btn--primary')
      .attr('type', 'submit')
      .text('Tallenna');
    
    $form.append($submitButton).appendTo(this.target);
  },
  
  submitForm: function($form) {
    const url = $form.attr('action');
    var data = {};
    
    $form.find('.js-input').each(function eachInput() {
      const $field = $(this);
      const name = $field.attr('name');
      const value = $field.val();
      data[name] = value;
    });
    
    console.log(data);
    
    /*
    const posting = $.post(url, {
      
    });
    */
  }
};