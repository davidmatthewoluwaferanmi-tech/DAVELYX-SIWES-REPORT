(function () {
  const selarLinks = {
    logbook: 'https://selar.com/5933256r73',
    technical: 'https://selar.com/zbb90t91x4',
    bundle: 'https://selar.com/hb979as992'
  };
  const payButton = document.getElementById('selarPayBtn');
  if (!payButton) return;
  const radios = document.querySelectorAll('input[name="package"]');

  const linkFor = (pkg) => {
    const value = pkg.toLowerCase();
    if (value.includes('3,000') || value.includes('logbook only')) return selarLinks.logbook;
    if (value.includes('8,000') || (value.includes('technical') && !value.includes('both'))) return selarLinks.technical;
    return selarLinks.bundle;
  };
  const updatePayButton = () => {
    const selected = document.querySelector('input[name="package"]:checked');
    if (!selected) return;
    payButton.href = linkFor(selected.value);
    payButton.textContent = selected.value.includes('3,000')
      ? 'Pay ₦3,000 - Secure via Selar 🔥'
      : selected.value.includes('8,000')
        ? 'Pay ₦8,000 - Secure via Selar 🔥'
        : 'Pay ₦10,000 - BESTSELLER 🔥';
  };

  payButton.href = selarLinks.bundle;
  payButton.target = '_blank';
  radios.forEach((radio) => radio.addEventListener('change', updatePayButton));
  updatePayButton();
  payButton.addEventListener('click', (event) => {
    const app = window.DavelyxApp;
    const details = app && app.validOrder();
    if (!details) {
      event.preventDefault();
      if (app) app.formStatus.textContent = 'Please fill all required fields before paying.';
      return;
    }
    try { localStorage.setItem('davelyx_last_order', JSON.stringify(details)); }
    catch (_) {
      event.preventDefault();
      app.formStatus.textContent = 'Could not save your order. Please enable browser storage and try again.';
      return;
    }
    payButton.href = linkFor(details.package);
    if (app) app.formStatus.textContent = 'Opening Selar securely. After payment, you will return here to confirm on WhatsApp.';
  });
})();
