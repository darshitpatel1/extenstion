(function () {
  function findByLabel(label) {
    const labels = Array.from(document.querySelectorAll('label'));
    for (const l of labels) {
      if (l.innerText.trim() === label) {
        const forId = l.getAttribute('for');
        if (forId) {
          return document.getElementById(forId);
        }
        return l.querySelector('input, textarea, select');
      }
    }
    return null;
  }

  function fill({ selector, label, value }) {
    let el = null;
    if (selector) {
      el = document.querySelector(selector);
    } else if (label) {
      el = findByLabel(label);
    }
    if (el) {
      el.focus();
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function click({ selector, text }) {
    let el = null;
    if (selector) {
      el = document.querySelector(selector);
    } else if (text) {
      el = Array.from(
        document.querySelectorAll(
          'button, input[type="button"], input[type="submit"], a, [role="button"]'
        )
      ).find(e => e.innerText.trim() === text);
    }
    if (el) {
      el.click();
    }
  }

  function remove({ selector }) {
    const el = document.querySelector(selector);
    if (el) el.remove();
  }

  function fillField(label, value) {
    fill({ label, value });
  }

  function clickByText(text) {
    click({ text });
  }

  window.__inspectAPI = {
    fill,
    click,
    remove,
    fillField,
    clickByText
  };
})();