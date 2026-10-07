(() => {
  'use strict';
  // Both pages have the same section IDs. Keep the topic when changing language.
  document.querySelectorAll('[data-help-language]').forEach(link => {
    link.addEventListener('click', () => {
      const url = new URL(link.getAttribute('href'), location.href);
      url.hash = location.hash;
      link.href = url.href;
    });
  });
})();
