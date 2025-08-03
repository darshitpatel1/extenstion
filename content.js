// content.js - scans DOM, builds element graph, injects sidebar UI

(async function() {
  const SIDEBAR_ID = 'ai-sidebar-container';
  const GRAPH_EVENT = 'ai-graph';

  // Inject helper script into page context for API and DOM functions
  const injectScript = document.createElement('script');
  injectScript.src = chrome.runtime.getURL('inject.js');
  (document.head || document.documentElement).appendChild(injectScript);

  // Create floating sidebar
  const container = document.createElement('div');
  container.id = SIDEBAR_ID;
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.right = '0';
  container.style.width = '300px';
  container.style.height = '100vh';
  container.style.zIndex = '2147483647';
  container.style.background = '#1e1e1e';
  container.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
  container.style.color = '#fff';
  container.style.fontFamily = 'monospace';
  container.style.overflow = 'auto';

  const sidebarHTML = await fetch(chrome.runtime.getURL('sidebar.html')).then(r => r.text());
  container.innerHTML = sidebarHTML;
  document.body.appendChild(container);

  // Load sidebar script
  const sidebarScript = document.createElement('script');
  sidebarScript.src = chrome.runtime.getURL('sidebar.js');
  container.appendChild(sidebarScript);

  // Build initial graph and send to sidebar
  function scan() {
    const elements = Array.from(document.querySelectorAll('input, button, select, textarea, a[href], [role="button"], form'));
    const graph = elements.map((el, idx) => {
      const rect = el.getBoundingClientRect();
      return {
        id: el.id || `ai-${idx}`,
        type: el.tagName.toLowerCase(),
        text: el.innerText || el.value || '',
        label: el.getAttribute('aria-label') || (el.labels && el.labels[0] ? el.labels[0].innerText : ''),
        placeholder: el.placeholder || '',
        value: el.value || '',
        required: el.required || false,
        form: el.form ? (el.form.id || el.form.name || '') : '',
        selector: getSelector(el),
        rect: {x: rect.x, y: rect.y, width: rect.width, height: rect.height},
        visible: !!(rect.width || rect.height)
      };
    });
    postToSidebar({type: GRAPH_EVENT, graph});
  }

  function getSelector(el) {
    if (el.id) return `#${el.id}`;
    const parts = [];
    if (el.className) {
      const cls = el.className.toString().trim().replace(/\s+/g, '.');
      parts.push(`${el.tagName.toLowerCase()}.${cls}`);
    } else {
      parts.push(el.tagName.toLowerCase());
    }
    return parts.join('');
  }

  function postToSidebar(data) {
    window.postMessage({__inspect: true, target: 'sidebar', data});
  }

  // Listen for messages from sidebar
  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (!msg || !msg.__inspect || msg.target !== 'content') return;
    const {action, payload} = msg;
    window.postMessage({__inspect: true, action, payload}, '*');
  });

  // Observe DOM changes
  const observer = new MutationObserver(() => scan());
  observer.observe(document.documentElement, {subtree: true, childList: true, attributes: true});

  // Initial scan
  scan();
})();
