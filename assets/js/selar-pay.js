(function () {
  const links = { logbook: 'https://selar.com/placeholder', report: 'https://selar.com/placeholder', bundle: 'https://selar.com/placeholder' };
  fetch('/api/selar-links').then(r => r.ok ? r.json() : Promise.reject()).then(data => Object.assign(links, data)).catch(() => {});
  const button = document.getElementById('selarPayBtn');
  if (!button) return;
  const radios = [...document.querySelectorAll('input[name="package"]')];
  const packageKey = value => {
    const v = String(value || '').toLowerCase();
    if (v.includes('logbook') || v.includes('3,000')) return 'logbook';
    if (v.includes('report') || v.includes('5,000') || v.includes('technical')) return 'report';
    return 'bundle';
  };
  const update = () => {
    const selected = document.querySelector('input[name="package"]:checked');
    if (!selected) return;
    const key = packageKey(selected.value);
    button.href = links[key];
    button.textContent = key === 'logbook' ? 'Pay ₦3,000 - Secure via Selar 🔥' : key === 'report' ? 'Pay ₦5,000 - Secure via Selar 🔥' : 'Pay ₦8,000 - BESTSELLER 🔥';
  };
  radios.forEach(radio => radio.addEventListener('change', update));
  update();
  button.addEventListener('click', event => {
    const app = window.DavelyxApp;
    const details = app && app.validOrder();
    if (!details) {
      event.preventDefault();
      if (app) app.formStatus.textContent = 'Please fill all required fields before paying.';
      return;
    }
    try { localStorage.setItem('davelyx_last_order', JSON.stringify(details)); }
    catch (_) { event.preventDefault(); if (app) app.formStatus.textContent = 'Could not save your order. Please enable browser storage and try again.'; return; }
    button.href = links[packageKey(details.package)];
    if (app) app.formStatus.textContent = 'Opening Selar securely. After payment, you will return here to confirm on WhatsApp.';
  });
})();
