(function () {
  const listEl = document.getElementById('ai-elements');
  const detailEl = document.getElementById('ai-detail');
  let elements = [];

  function send(message) {
    window.postMessage(Object.assign({ source: 'sidebar' }, message), '*');
  }

  window.addEventListener('message', function (e) {
    if (!e.data || e.data.source !== 'content-script') return;
    const { action, payload, id } = e.data;
    if (action === 'graph') {
      elements = payload || [];
      renderList();
    } else if (action === 'hover') {
      highlightItem(id);
    }
  });

  function renderList() {
    listEl.innerHTML = '';
    elements.forEach(el => {
      const li = document.createElement('li');
      li.textContent = '[' + el.type + '] ' + (el.label || el.text || el.selector);
      li.dataset.id = el.id;
      li.addEventListener('mouseover', () => send({ action: 'highlight', id: el.id }));
      li.addEventListener('click', () => selectElement(el.id));
      listEl.appendChild(li);
    });
  }

  function highlightItem(id) {
    const li = listEl.querySelector('li[data-id="' + id + '"]');
    if (li) {
      listEl.querySelectorAll('li').forEach(n => n.classList.remove('hover'));
      li.classList.add('hover');
      li.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }

  function selectElement(id) {
    const el = elements.find(e => e.id === id);
    listEl.querySelectorAll('li').forEach(n => n.classList.toggle('active', n.dataset.id === id));
    renderDetail(el);
  }

  function renderDetail(el) {
    detailEl.innerHTML = '';
    if (!el) return;
    const title = document.createElement('div');
    title.textContent = el.selector;
    detailEl.appendChild(title);

    const inp = document.createElement('input');
    const editableValue = (el.type === 'input' || el.type === 'textarea' || el.type === 'select');
    inp.value = editableValue ? (el.value || '') : (el.text || '');
    inp.addEventListener('change', () => {
      send({ action: editableValue ? 'setValue' : 'setText', id: el.id, value: inp.value });
    });
    detailEl.appendChild(inp);

    const btnClick = document.createElement('button');
    btnClick.textContent = 'Click';
    btnClick.addEventListener('click', () => send({ action: 'click', id: el.id }));
    detailEl.appendChild(btnClick);

    const btnRemove = document.createElement('button');
    btnRemove.textContent = 'Remove';
    btnRemove.addEventListener('click', () => send({ action: 'remove', id: el.id }));
    detailEl.appendChild(btnRemove);
  }

  send({ action: 'ready' });
})();
