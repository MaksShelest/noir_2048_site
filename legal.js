(() => {
  'use strict';
  // Load the full translated document, keeping the same numbered section.
  document.querySelectorAll('[data-document-language]').forEach(link => {
    link.addEventListener('click', () => {
      const url = new URL(link.getAttribute('href'), location.href);
      url.hash = location.hash;
      link.href = url.href;
    });
  });
})();
