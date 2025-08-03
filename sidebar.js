// sidebar.js - renders element graph and interactions within sidebar
(function() {
  const elementsDiv = document.getElementById('elements');
  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (!msg || !msg.__inspect || msg.target !== 'sidebar') return;
    if (msg.data && msg.data.type === 'ai-graph') {
      render(msg.data.graph);
    }
  });

  function render(graph) {
    elementsDiv.innerHTML = '';
    graph.forEach(item => {
      const row = document.createElement('div');
      row.className = 'ai-row';
      row.textContent = `${item.type} - ${item.label || item.text || item.selector}`;
      row.addEventListener('mouseenter', () => highlight(item.selector));
      row.addEventListener('mouseleave', () => highlight(null));
      row.addEventListener('click', () => edit(item));

      const clickBtn = document.createElement('button');
      clickBtn.textContent = 'click';
      clickBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        parent.postMessage({__inspect: true, target: 'content', action: 'click', payload: {selector: item.selector}}, '*');
      });
      row.appendChild(clickBtn);
      elementsDiv.appendChild(row);
    });
  }

  function highlight(selector) {
    parent.postMessage({__inspect: true, target: 'content', action: 'highlight', payload: {selector}}, '*');
  }

  function edit(item) {
    const newVal = prompt('New value/text:', item.value || item.text || '');
    if (newVal !== null) {
      parent.postMessage({__inspect: true, target: 'content', action: 'set', payload: {selector: item.selector, value: newVal}}, '*');
    }
  }
})();
