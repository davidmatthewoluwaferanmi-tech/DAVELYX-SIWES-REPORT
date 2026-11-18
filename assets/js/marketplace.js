(function () {
  const categories = ['All', 'Phones & Tablets', 'Electronics', 'Fashion', 'Home & Garden', 'Vehicles', 'Property', 'Services', 'Jobs', 'Books & Hobbies', 'SIWES Materials'];
  const states = ['All Nigeria', 'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'];
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]));
  let products = [];
  let loadError = null;

  const formatPrice = value => `₦${Number(value || 0).toLocaleString('en-NG')}`;
  const imageUrl = product => Array.isArray(product.images) && product.images[0]
    ? product.images[0]
    : 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80';

  // Keep the existing location filters; only expand their options to all states and FCT.
  ['marketLocation', 'location-filter'].forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;
    const selected = select.value;
    const allValue = id === 'marketLocation' ? 'All Nigeria' : '';
    select.innerHTML = states.map((state, index) => {
      const value = index === 0 ? allValue : state;
      return `<option value="${escapeHtml(value)}">${escapeHtml(state)}</option>`;
    }).join('');
    if (states.some((state, index) => (index === 0 ? allValue : state) === selected)) select.value = selected;
  });

  function filteredProducts() {
    const categoryButton = document.querySelector('.cat-btn.active');
    const category = categoryButton?.dataset.cat || 'All';
    const query = (document.getElementById('marketSearch')?.value || document.getElementById('search-query')?.value || '').trim().toLowerCase();
    const location = document.getElementById('marketLocation')?.value || document.getElementById('location-filter')?.value || '';
    const min = Number(document.getElementById('min-price')?.value || 0);
    const max = Number(document.getElementById('max-price')?.value || 0);
    const verifiedOnly = Boolean(document.getElementById('verified-only')?.checked);
    return products.filter(product => {
      const productCategory = product.category || '';
      const searchable = `${product.title || ''} ${productCategory} ${product.description || ''}`.toLowerCase();
      const productLocation = String(product.location || '');
      return (category === 'All' || productCategory === category)
        && (!query || searchable.includes(query))
        && (!location || location === 'All Nigeria' || productLocation.toLowerCase().includes(location.toLowerCase()))
        && (!min || Number(product.price) >= min)
        && (!max || Number(product.price) <= max)
        && (!verifiedOnly || Boolean(product.is_verified));
    });
  }

  function renderMarketplace() {
    const grid = document.getElementById('listing-grid');
    if (!grid) return;
    const results = filteredProducts();
    grid.innerHTML = results.map(product => `<article class="listing-card"><a href="item.html?id=${encodeURIComponent(product.id)}"><img class="listing-photo" src="${escapeHtml(imageUrl(product))}" alt="${escapeHtml(product.title)}"><div class="listing-card-body"><span class="listing-category">${escapeHtml(product.category)}</span><h3>${escapeHtml(product.title)}</h3><p class="listing-price">${formatPrice(product.price)}</p><p>${escapeHtml(product.location || '')}</p></div></a></article>`).join('');
    document.getElementById('result-count').textContent = `${results.length} listings`;
    const empty = document.getElementById('empty-state');
    empty.hidden = results.length > 0;
    empty.textContent = products.length ? 'No listings match those filters. Try changing your search.' : 'No listings yet, be the first to post!';
    if (loadError && products.length === 0) empty.textContent = 'Listings could not be loaded. Please try again later.';
  }

  function renderHome() {
    const grid = document.getElementById('marketGrid');
    if (!grid) return;
    const query = (document.getElementById('marketSearch')?.value || '').trim().toLowerCase();
    const location = document.getElementById('marketLocation')?.value || 'All Nigeria';
    const activeCategory = document.querySelector('.cat-btn.active')?.dataset.cat || 'All';
    const results = products.filter(product => {
      const searchable = `${product.title || ''} ${product.category || ''} ${product.description || ''}`.toLowerCase();
      return (!query || searchable.includes(query))
        && (location === 'All Nigeria' || String(product.location || '').toLowerCase().includes(location.toLowerCase()) || product.location === 'Any Location')
        && (activeCategory === 'All' || product.category === activeCategory);
    });
    grid.innerHTML = results.map(product => `<article class="m-card" role="link" tabindex="0" onclick="location.href='item.html?id=${encodeURIComponent(product.id)}'" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();location.href='item.html?id=${encodeURIComponent(product.id)}'}"><div class="m-img">${Array.isArray(product.images) && product.images[0] ? `<img src="${escapeHtml(product.images[0])}" alt="${escapeHtml(product.title)}">` : '🛍️'}</div><div class="m-body"><div class="m-price">${formatPrice(product.price)}</div><div class="m-title">${escapeHtml(product.title)}</div><div class="m-meta"><span>${escapeHtml(product.location || '')}</span></div></div></article>`).join('');
    const empty = document.getElementById('market-empty-state');
    if (empty) {
      empty.hidden = results.length > 0;
      empty.textContent = products.length ? 'No listings match your search.' : 'No listings yet, be the first to post!';
    } else if (!results.length) {
      grid.innerHTML = '<p class="market-empty-state">No listings yet, be the first to post!</p>';
    }
  }

  // The homepage has legacy inline demo rendering. Replace its renderer so no demo IDs
  // (such as m103) are ever emitted as links on the live site.
  if (document.getElementById('marketGrid')) window.renderMarket = renderHome;
  if (document.body.dataset.page === 'marketplace') {
    const bar = document.getElementById('category-bar');
    bar.innerHTML = categories.map(name => `<button class="category-chip${name === 'All' ? ' active' : ''}" type="button" data-category="${escapeHtml(name)}">${escapeHtml(name)}</button>`).join('');
    bar.addEventListener('click', event => {
      const button = event.target.closest('[data-category]');
      if (!button) return;
      bar.querySelectorAll('.category-chip').forEach(chip => chip.classList.toggle('active', chip === button));
      document.getElementById('results-title').textContent = button.dataset.category === 'All' ? 'All listings' : button.dataset.category;
      renderMarketplace();
    });
    document.getElementById('market-search').addEventListener('submit', event => { event.preventDefault(); renderMarketplace(); });
    ['search-query', 'location-filter', 'min-price', 'max-price', 'verified-only'].forEach(id => document.getElementById(id).addEventListener('input', renderMarketplace));
    document.getElementById('clear-filters').addEventListener('click', () => {
      ['search-query', 'location-filter', 'min-price', 'max-price'].forEach(id => { document.getElementById(id).value = ''; });
      document.getElementById('verified-only').checked = false;
      bar.querySelectorAll('.category-chip').forEach(chip => chip.classList.toggle('active', chip.dataset.category === 'All'));
      document.getElementById('results-title').textContent = 'All listings';
      renderMarketplace();
    });
  }

  if (document.getElementById('marketGrid')) {
    document.querySelectorAll('.cat-btn').forEach(button => button.addEventListener('click', () => setTimeout(renderHome, 0)));
    ['marketSearch', 'marketLocation'].forEach(id => document.getElementById(id)?.addEventListener('input', renderHome));
    window.renderMarket = renderHome;
  }
  window.filterCat = category => {
    document.querySelectorAll('.cat-btn').forEach(button => button.classList.toggle('active', button.dataset.cat === category));
    renderHome();
  };
  window.filterMarket = renderHome;

  import('./supabase.js').then(async ({ supabase }) => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) {
      loadError = error;
      console.error('Marketplace product fetch failed:', error);
    } else {
      products = data || [];
    }
    renderMarketplace();
    renderHome();
  }).catch(error => {
    loadError = error;
    console.error('Could not initialize Supabase marketplace:', error);
    renderMarketplace();
    renderHome();
  });

  window.Tawk_API = window.Tawk_API || {};
  window.Tawk_LoadStart = new Date();
  const tawk = document.createElement('script');
  tawk.async = true;
  tawk.src = 'https://embed.tawk.to/6afbb430c812c53cc041b184/1k7jjfo2t';
  tawk.charset = 'UTF-8';
  tawk.setAttribute('crossorigin', '*');
  document.head.appendChild(tawk);
})();
