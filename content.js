(function () {
  if (window.__advancedInspectLoaded) return;
  window.__advancedInspectLoaded = true;

  const elementMap = new Map();
  let graph = [];
  let observer;
  let nextId = 0;

  // Load styles
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('style.css');
  document.head.appendChild(link);

  // Sidebar container
  const sidebar = document.createElement('div');
  sidebar.id = 'ai-sidebar';
  document.body.appendChild(sidebar);

  fetch(chrome.runtime.getURL('sidebar.html'))
    .then(r => r.text())
    .then(html => {
      sidebar.innerHTML = html;
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('sidebar.js');
      document.documentElement.appendChild(script);
    });

  // Highlight box
  const highlightBox = document.createElement('div');
  highlightBox.id = 'ai-highlight';
  document.body.appendChild(highlightBox);

  // Inject API script
  const apiScript = document.createElement('script');
  apiScript.src = chrome.runtime.getURL('inject.js');
  document.documentElement.appendChild(apiScript);

  function getLabel(el) {
    if (el.id) {
      const l = document.querySelector('label[for="' + el.id + '"]');
      if (l) return l.innerText.trim();
    }
    const parent = el.closest('label');
    if (parent) return parent.innerText.trim();
    return '';
  }

  function generateSelector(el) {
    if (el.id) return '#' + el.id;
    let sel = el.tagName.toLowerCase();
    if (el.className) {
      const classes = el.className.trim().split(/\s+/).slice(0, 2).join('.');
      if (classes) sel += '.' + classes;
    }
    return sel;
  }

  function buildGraph() {
    graph = [];
    elementMap.clear();
    const selector = 'input, textarea, select, button, a[href], [role="button"], [onclick]';
    const els = document.querySelectorAll(selector);
    els.forEach(el => {
      let id = el.dataset.aiId;
      if (!id) {
        id = 'ai-' + (nextId++);
        el.dataset.aiId = id;
      }
      const rect = el.getBoundingClientRect();
      graph.push({
        id,
        type: el.tagName.toLowerCase(),
        text: el.innerText ? el.innerText.trim() : '',
        label: getLabel(el),
        placeholder: el.placeholder || '',
        value: el.value || '',
        required: !!el.required,
        form: el.form ? (el.form.id || el.form.name || '') : '',
        selector: generateSelector(el),
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        visible: rect.width > 0 && rect.height > 0
      });
      elementMap.set(id, el);
    });
  }

  function sendGraph() {
    if (observer) observer.disconnect();
    buildGraph();
    window.postMessage({ source: 'content-script', action: 'graph', payload: graph }, '*');
    if (observer) {
      observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
    }
  }

  function highlight(el) {
    const rect = el.getBoundingClientRect();
    highlightBox.style.display = 'block';
    highlightBox.style.left = rect.left + window.scrollX + 'px';
    highlightBox.style.top = rect.top + window.scrollY + 'px';
    highlightBox.style.width = rect.width + 'px';
    highlightBox.style.height = rect.height + 'px';
  }

  function hideHighlight() {
    highlightBox.style.display = 'none';
  }

  document.addEventListener('mousemove', e => {
    if (e.ctrlKey) {
      const el = e.target;
      const id = el.dataset.aiId;
      if (id) {
        highlight(el);
        window.postMessage({ source: 'content-script', action: 'hover', id }, '*');
      }
    } else {
      hideHighlight();
    }
  });

  window.addEventListener('message', e => {
    if (!e.data) return;
    if (e.data.source === 'sidebar') {
      const { action, id, value } = e.data;
      if (action === 'ready') {
        sendGraph();
        return;
      }
      const el = elementMap.get(id);
      if (!el) return;
      switch (action) {
        case 'highlight':
          highlight(el);
          break;
        case 'setValue':
          el.value = value;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          break;
        case 'setText':
          el.innerText = value;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          break;
        case 'click':
          el.click();
          break;
        case 'remove':
          el.remove();
          break;
      }
    }
  });

  observer = new MutationObserver(() => {
    sendGraph();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });

  sendGraph();
})();