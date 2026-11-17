(function () {
  const selarLinks = {
    logbook: 'https://selar.com/5933256r73',
    technical: 'https://selar.com/zbb90t91x4',
    bundle: 'https://selar.com/hb979as992'
  };
  const selarPayBtn = document.getElementById('selarPayBtn');
  const radios = document.querySelectorAll('input[name="package"]');
  if (!selarPayBtn) return;

  const getSelarLink = (pkg) => {
    const value = pkg.toLowerCase();
    if (value.includes('3,000') || value.includes('logbook only')) return selarLinks.logbook;
    if (value.includes('8,000') || (value.includes('technical') && !value.includes('both'))) return selarLinks.technical;
    return selarLinks.bundle;
  };
  const updatePayButton = () => {
    const selected = document.querySelector('input[name="package"]:checked');
    if (!selected) return;
    selarPayBtn.href = getSelarLink(selected.value);
    if (selected.value.includes('3,000')) selarPayBtn.textContent = 'Pay ₦3,000 - Secure via Selar 🔥';
    else if (selected.value.includes('8,000')) selarPayBtn.textContent = 'Pay ₦8,000 - Secure via Selar 🔥';
    else selarPayBtn.textContent = 'Pay ₦10,000 - BESTSELLER 🔥';
  };

  selarPayBtn.href = selarLinks.bundle;
  selarPayBtn.target = '_blank';
  radios.forEach((radio) => radio.addEventListener('change', updatePayButton));
  updatePayButton();

  selarPayBtn.addEventListener('click', (event) => {
    const app = window.DavelyxApp;
    const details = app && app.validOrder();
    if (!details) {
      event.preventDefault();
      if (app) app.formStatus.textContent = 'Please fill all required fields before paying.';
      return;
    }
    try { localStorage.setItem('davelyx_last_order', JSON.stringify(details)); } catch (_) {}
    selarPayBtn.href = getSelarLink(details.package);
    if (app) app.formStatus.textContent = 'Redirecting to secure payment... After payment, you will confirm on WhatsApp.';
    setTimeout(() => {
      const message = app.orderMessage(details);
      window.open(`https://wa.me/2349035589937?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    }, 1500);
  });
})();
