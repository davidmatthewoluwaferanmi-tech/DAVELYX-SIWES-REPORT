(function () {
  document.getElementById('year').textContent = new Date().getFullYear();
  const visitorCount = document.getElementById('visitor-count');
  try {
    const saved = Number(localStorage.getItem('davelyxVisitorCount'));
    if (saved > 0) visitorCount.textContent = `${saved.toLocaleString()} visits`;
  } catch (_) {}
  fetch('https://api.countapi.xyz/hit/davelyx-siwes-plug/visits')
    .then((response) => { if (!response.ok) throw new Error('Count service unavailable'); return response.json(); })
    .then((data) => {
      if (Number.isFinite(Number(data.value))) {
        visitorCount.textContent = `${Number(data.value).toLocaleString()} visits`;
        try { localStorage.setItem('davelyxVisitorCount', String(data.value)); } catch (_) {}
      }
    }).catch(() => {});

  const orderForm = document.getElementById('order-form');
  const formStatus = document.getElementById('form-status');
  const orderDetails = () => {
    const data = new FormData(orderForm);
    return {
      name: String(data.get('name') || '').trim(), department: String(data.get('department') || '').trim(),
      institution: String(data.get('institution') || '').trim(), company: String(data.get('company') || '').trim(),
      location: String(data.get('location') || '').trim(), duration: String(data.get('duration') || ''),
      package: String(data.get('package') || ''), whatsapp: String(data.get('whatsapp') || '').trim()
    };
  };
  const validOrder = () => {
    if (!orderForm.reportValidity()) return null;
    const details = orderDetails();
    if (details.whatsapp.replace(/\D/g, '').length < 10) {
      document.getElementById('whatsapp-number').setCustomValidity('Enter a complete WhatsApp number.');
      orderForm.reportValidity();
      return null;
    }
    document.getElementById('whatsapp-number').setCustomValidity('');
    return details;
  };
  const orderMessage = (details) => `Hello DAVELYX! I just paid for ${details.package} via Selar. My order details: Name: ${details.name}, Dept: ${details.department}, School: ${details.institution}, Company: ${details.company}, Location: ${details.location}, Duration: ${details.duration}, My WhatsApp: ${details.whatsapp}. Please confirm my order for 24hr delivery.`;
  window.DavelyxApp = { orderDetails, validOrder, orderMessage, formStatus };

  const navLinks = document.querySelector('.nav-links');
  if (navLinks && !navLinks.querySelector('a[href="marketplace.html"]')) {
    const home = document.createElement('a'); home.href = 'index.html'; home.textContent = 'Home'; navLinks.prepend(home);
    const market = document.createElement('a'); market.href = 'marketplace.html'; market.textContent = 'Marketplace'; navLinks.appendChild(market);
    const products = navLinks.querySelector('a[href="#products"]'); if (products) products.href = 'index.html#products';
    const how = navLinks.querySelector('a[href="#how-it-works"]'); if (how) how.href = 'index.html#how-it-works';
  }
  document.getElementById('whatsapp-number').addEventListener('input', (event) => event.currentTarget.setCustomValidity(''));
  document.getElementById('tawk-order').addEventListener('click', () => {
    const details = validOrder(); if (!details) return;
    const message = orderMessage(details); formStatus.textContent = 'Opening live support...';
    window.Tawk_API = window.Tawk_API || {};
    const prefillTawk = () => {
      try {
        window.Tawk_API.setAttributes({ name: details.name, order_details: message }, function (error) { if (error) console.warn(error); });
        window.Tawk_API.addEvent('order_request', { order_details: message }); window.Tawk_API.maximize(); formStatus.textContent = 'Live support opened.';
      } catch (error) { formStatus.textContent = 'Live support is loading. Try again.'; }
    };
    if (window.Tawk_API.onLoad) prefillTawk(); else window.Tawk_API.onLoad = prefillTawk;
  });
  window.Tawk_API = window.Tawk_API || {};
  window.Tawk_LoadStart = new Date();
  window.Tawk_API.customStyle = { visibility: { desktop: { position: 'bl', xOffset: '20px', yOffset: '20px' }, mobile: { position: 'bl', xOffset: '12px', yOffset: '12px' } } };
  const tawkScript = document.createElement('script'); tawkScript.async = true;
  tawkScript.src = 'https://embed.tawk.to/6afbb430c812c53cc041b184/1k7jjfo2t'; tawkScript.charset = 'UTF-8'; tawkScript.setAttribute('crossorigin', '*'); document.head.appendChild(tawkScript);
  const goatCounter = document.createElement('script'); goatCounter.dataset.goatcounter = 'https://davelyx.goatcounter.com/count'; goatCounter.async = true; goatCounter.src = 'https://gc.zgo.at/count.js'; document.body.appendChild(goatCounter);
})();
