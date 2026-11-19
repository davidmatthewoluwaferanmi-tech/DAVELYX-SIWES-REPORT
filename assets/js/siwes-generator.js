(() => {
  const form = document.getElementById('siwes-form');
  const status = document.getElementById('siwes-status');
  const pay = document.getElementById('siwes-pay');
  const confirm = document.getElementById('siwes-confirm-payment');
  const result = document.getElementById('siwes-result');
  const output = document.getElementById('siwes-document');
  const packageRadios = [...form.querySelectorAll('[name="package"]')];
  let paymentStarted = false;

  const linksPromise = fetch('/api/selar-links').then(r => r.ok ? r.json() : Promise.reject(new Error('Payment links unavailable'))).catch(() => ({
    logbook: 'https://selar.com/placeholder', report: 'https://selar.com/placeholder', bundle: 'https://selar.com/placeholder'
  }));
  function selectedPackage() { return form.querySelector('[name="package"]:checked')?.value || ''; }
  function formFields() { return Object.fromEntries(new FormData(form).entries()); }
  function updateLink() {
    const pkg = selectedPackage();
    if (!pkg) return;
    linksPromise.then(links => {
      pay.href = pkg === 'logbook_only' ? links.logbook : pkg === 'report_only' ? links.report : links.bundle;
    });
  }
  packageRadios.forEach(radio => radio.addEventListener('change', updateLink));
  pay.addEventListener('click', event => {
    if (!form.reportValidity()) { event.preventDefault(); return; }
    if (!selectedPackage()) { event.preventDefault(); status.textContent = 'Please select a package.'; return; }
    if (!form.elements.logbook.value.trim()) { event.preventDefault(); status.textContent = 'Please enter your logbook, we cannot invent work for you'; return; }
    paymentStarted = true;
    confirm.disabled = false;
    try { sessionStorage.setItem('davelyx_siwes_order', JSON.stringify(formFields())); } catch (_) {}
    status.textContent = 'Selar opened in a new tab. V1 generation is enabled after you return and confirm payment; payment is not automatically verified yet.';
  });
  confirm.addEventListener('click', async () => {
    if (!paymentStarted) { status.textContent = 'Select your package and continue to Selar first.'; return; }
    if (!selectedPackage()) { status.textContent = 'Please select a package.'; return; }
    if (!form.elements.logbook.value.trim()) { status.textContent = 'Please enter your logbook, we cannot invent work for you'; return; }
    const button = confirm;
    button.disabled = true;
    status.textContent = 'Generating your document…';
    try {
      const response = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: formFields() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Generation failed.');
      output.textContent = data.markdown;
      result.hidden = false;
      status.textContent = 'Document generated.';
      result.scrollIntoView({ behavior: 'smooth' });
    } catch (error) { status.textContent = error.message; }
    finally { button.disabled = false; }
  });
  document.getElementById('copy-document').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(output.textContent); status.textContent = 'Document copied.'; }
    catch (_) { status.textContent = 'Could not copy automatically. Select and copy the document text.'; }
  });
  document.getElementById('download-pdf').addEventListener('click', () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { status.textContent = 'Allow pop-ups to print or save your PDF.'; return; }
    const escaped = output.textContent.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    printWindow.document.write(`<!doctype html><html><head><title>DAVELYX SIWES Document</title><style>body{font:12pt/1.6 Arial,sans-serif;max-width:800px;margin:40px auto;white-space:pre-wrap} @media print{body{margin:18mm}}</style></head><body>${escaped}</body></html>`);
    printWindow.document.close(); printWindow.focus(); printWindow.print();
  });
})();
