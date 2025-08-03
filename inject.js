// inject.js - runs in page context, exposes __inspectAPI and handles DOM ops
(function() {
  let highlightBox;

  function highlightElement(selector) {
    if (!selector) {
      if (highlightBox) highlightBox.remove();
      return;
    }
    const el = document.querySelector(selector);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!highlightBox) {
      highlightBox = document.createElement('div');
      highlightBox.style.position = 'absolute';
      highlightBox.style.border = '2px solid #00ffff';
      highlightBox.style.zIndex = '2147483647';
      document.body.appendChild(highlightBox);
    }
    highlightBox.style.left = rect.x + 'px';
    highlightBox.style.top = rect.y + 'px';
    highlightBox.style.width = rect.width + 'px';
    highlightBox.style.height = rect.height + 'px';
  }

  function setValue(selector, value) {
    const el = document.querySelector(selector);
    if (!el) return;
    if ('value' in el) {
      el.value = value;
      el.dispatchEvent(new Event('input', {bubbles: true}));
      el.dispatchEvent(new Event('change', {bubbles: true}));
    } else {
      el.textContent = value;
    }
  }

  function click(selector) {
    const el = document.querySelector(selector);
    if (el) el.click();
  }

  function fillField({label, value}) {
    const el = Array.from(document.querySelectorAll('input, textarea, select')).find(e => {
      const lbl = e.getAttribute('aria-label') || (e.labels && e.labels[0] ? e.labels[0].innerText : '');
      return lbl.trim().toLowerCase() === label.trim().toLowerCase();
    });
    if (el) setValue(getSelector(el), value);
  }

  function clickByText(text) {
    const el = Array.from(document.querySelectorAll('button, [role="button"], a, input[type="button"], input[type="submit"]')).find(e => e.innerText.trim() === text.trim());
    if (el) el.click();
  }

  function removeBySelector(selector) {
    const el = document.querySelector(selector);
    if (el) el.remove();
  }

  function getSelector(el) {
    if (el.id) return `#${el.id}`;
    const parts = [el.tagName.toLowerCase()];
    if (el.className) parts.push('.' + el.className.toString().trim().replace(/\s+/g, '.'));
    return parts.join('');
  }

  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || !data.__inspect) return;
    const {action, payload} = data;
    if (action === 'highlight') highlightElement(payload.selector);
    if (action === 'set') setValue(payload.selector, payload.value);
    if (action === 'click') click(payload.selector);
    if (action === 'remove') removeBySelector(payload.selector);
    if (action === 'fill') fillField(payload);
  });

  window.__inspectAPI = {
    clickByText,
    fillField,
    remove: removeBySelector
  };
})();
