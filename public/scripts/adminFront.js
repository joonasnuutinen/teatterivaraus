'use strict';

$(function documentReady() {
  const contentDataLibrary = {
    docs: {
      formFields: [
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
      ],
      genitive: 'ohjeen',
      previewFields: ['title'],
      rowType: 'doc'
    }
  };
  
  const $dynamic = $('#dynamic');
  const contentType = $dynamic.attr('data-content');
  const contentData = contentDataLibrary[contentType];
  
  if (!contentData) return;
  
  const contentObject = Object.create(RowContainer);
  contentObject.init(contentData);
});