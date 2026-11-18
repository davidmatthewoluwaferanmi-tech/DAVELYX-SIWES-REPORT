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

  // Keep the marketplace entry points visible even if the cached homepage markup predates the marketplace launch.
  const nav = document.querySelector('.site-header .nav');
  const navLinks = nav && nav.querySelector('.nav-links');
  if (navLinks) {
    if (!navLinks.querySelector('a[href="marketplace.html"]')) {
      const link = document.createElement('a'); link.href = 'marketplace.html'; link.textContent = 'Marketplace'; navLinks.appendChild(link);
    }
    if (!nav.querySelector('a[href="sell.html"]')) {
      const sellLink = document.createElement('a'); sellLink.href = 'sell.html'; sellLink.textContent = '+ Sell';
      sellLink.style.cssText = 'background:#ff6a00;color:white;padding:8px 16px;border-radius:20px;font-weight:800';
      nav.appendChild(sellLink);
    }
  }
  const heroActions = document.querySelector('.hero-actions');
  if (heroActions && !heroActions.querySelector('a[href="marketplace.html"]')) {
    const browse = document.createElement('a'); browse.className = 'btn btn-gold'; browse.href = 'marketplace.html'; browse.textContent = 'Browse Marketplace (Buy Anything)';
    const sell = document.createElement('a'); sell.className = 'btn btn-outline'; sell.href = 'sell.html'; sell.textContent = 'Sell Anything - Free';
    heroActions.append(browse, sell);
  }
  const orderCard = document.querySelector('#order .order-card');
  if (orderCard && !orderCard.querySelector('.marketplace-promo')) {
    const banner = document.createElement('div'); banner.className = 'marketplace-promo';
    banner.style.cssText = 'background:#fff3e0;padding:15px;border-radius:10px;text-align:center;margin:0 0 20px;color:#0D221B';
    banner.innerHTML = 'Want to buy/sell anything like Jiji? <a href="marketplace.html" style="font-weight:800;text-decoration:underline">Go to DAVELYX Marketplace - No account needed to buy</a>';
    orderCard.insertBefore(banner, orderCard.firstChild);
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
