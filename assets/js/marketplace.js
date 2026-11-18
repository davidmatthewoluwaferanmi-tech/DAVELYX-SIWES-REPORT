(function () {
  const categories = ['All', 'Phones & Tablets', 'Electronics', 'Fashion', 'Home & Garden', 'Vehicles', 'Property', 'Services', 'Jobs', 'Books & Hobbies', 'SIWES Materials'];
  const mockItems = [
    ['m101','Phones & Tablets','iPhone 13, 128GB — excellent condition',425000,'Lagos, Ikeja','New',true,'photo-1592750475338-74b7b21085ab','08123456701'],
    ['m102','Fashion','Classic leather sneakers — size 42',28000,'Ibadan, Oyo','New',true,'photo-1542291026-7eec264c27ff','08123456702'],
    ['m103','Electronics','HP Core i5 laptop, 8GB RAM, SSD',385000,'Abuja, Wuse','Used',true,'photo-1496181133206-80ce9b88a853','08123456703'],
    ['m104','Home & Garden','Solid wood accent chair',65000,'Lagos, Surulere','Used',false,'photo-1503602642458-232111445657','08123456704'],
    ['m105','Fashion','Premium human hair wig, 18 inch',95000,'Port Harcourt, GRA','New',true,'photo-1522337360788-8b13dee7a37e','08123456705'],
    ['m106','Phones & Tablets','Samsung Galaxy A54, 256GB',315000,'Kano, Nassarawa','Used',false,'photo-1511707171634-5f897ff02aa9','08123456706'],
    ['m107','Electronics','Wireless noise-cancelling headphones',58000,'Lagos, Yaba','New',true,'photo-1505740420928-5e560c06d30e','08123456707'],
    ['m108','Home & Garden','Two-seater fabric sofa',180000,'Ibadan, Bodija','Used',true,'photo-1555041469-a586c61ea9bc','08123456708'],
    ['m109','Vehicles','Toyota Corolla 2010 — clean title',6500000,'Abuja, Garki','Used',true,'photo-1492144534655-ae79c964c9d7','08123456709'],
    ['m110','Books & Hobbies','Engineering textbooks (set of 4)',18000,'Enugu, Independence Layout','Used',false,'photo-1507842217343-583bb7270b66','08123456710'],
    ['m111','Fashion','Everyday leather shoulder bag',22000,'Lagos, Lekki','New',true,'photo-1548036328-c9fa89d128fa','08123456711'],
    ['m112','Electronics','27-inch Full HD monitor',145000,'Benin City, GRA','Used',true,'photo-1527443224154-c4a3942d3acf','08123456712'],
    ['m113','Home & Garden','Compact study desk with drawer',75000,'Ilorin, Tanke','New',false,'photo-1518455027359-f3f8164ba6bd','08123456713'],
    ['m114','Phones & Tablets','iPad 9th generation, 64GB Wi-Fi',370000,'Lagos, Ikeja','Used',true,'photo-1544244015-0df4b3ffc6b0','08123456714'],
    ['m115','SIWES Materials','SIWES logbook and report support',3000,'Lagos, Online','New',true,'photo-1456324504439-367cee3b3c32','08123456715'],
    ['m116','Services','Professional photography session',45000,'Abuja, Maitama','New',true,'photo-1542038784456-1ea8e935640e','08123456716'],
    ['m117','Fashion','Unisex wristwatch, stainless steel',35000,'Ibadan, Challenge','New',false,'photo-1524592094714-0f0654e20314','08123456717'],
    ['m118','Property','Self-contained room, close to campus',450000,'Enugu, Nsukka','Used',true,'photo-1522708323590-d24dbb6b0267','08123456718'],
    ['m119','Jobs','Part-time social media assistant',80000,'Lagos, Remote','New',false,'photo-1521737711867-e3b97375f902','08123456719'],
    ['m120','Books & Hobbies','Acoustic guitar with soft case',85000,'Port Harcourt, Rumuola','Used',true,'photo-1510915361894-db8b60106cb1','08123456720']
  ].map(([id,category,title,price,location,condition,verified,photo,phone]) => ({id,category,title,price,location,condition,verified,phone,sellerName:'DAVELYX Seller',memberSince:'2024',description:`${title}. ${condition} item in ${location}. Message the seller on WhatsApp for more details and a safe public meetup.`,images:[`https://images.unsplash.com/${photo}?auto=format&fit=crop&w=900&q=80`]}));
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const readPosted = () => { try { const data = JSON.parse(localStorage.getItem('pending_items') || '[]'); return Array.isArray(data) ? data.filter(item => item && item.status === 'approved') : []; } catch (_) { return []; } };
  const allItems = () => [...readPosted(), ...mockItems];
  const imageUrl = (item) => item.images && item.images[0] || 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80';
  const formatPrice = (price) => `₦${Number(price || 0).toLocaleString('en-NG')}`;
  const card = (item) => `<article class="listing-card"><a href="item.html?id=${encodeURIComponent(item.id)}"><img class="listing-photo" src="${escapeHtml(imageUrl(item))}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.style.visibility='hidden'"></a><div class="listing-info"><p class="listing-price">${formatPrice(item.price)}</p><h3 class="listing-title">${escapeHtml(item.title)}</h3><p class="listing-location">⌖ ${escapeHtml(item.location)}</p><div class="listing-actions">${item.verified ? '<span class="verified-badge">✓ Verified</span>' : '<span></span>'}<a class="btn btn-gold" href="https://wa.me/234${String(item.phone || '').replace(/\D/g,'').replace(/^234/,'')}?text=${encodeURIComponent(`Hi, I'm interested in ${item.title}`)}" target="_blank" rel="noopener noreferrer">Chat</a></div></div></article>`;
  const installTawk = () => {
    window.Tawk_API = window.Tawk_API || {}; window.Tawk_LoadStart = new Date();
    window.Tawk_API.customStyle = {visibility:{desktop:{position:'bl',xOffset:'20px',yOffset:'20px'},mobile:{position:'bl',xOffset:'12px',yOffset:'12px'}}};
    const script = document.createElement('script'); script.async = true; script.src = 'https://embed.tawk.to/6afbb430c812c53cc041b184/1k7jjfo2t'; script.charset = 'UTF-8'; script.setAttribute('crossorigin','*'); document.head.appendChild(script);
  };
  installTawk();

  if (document.body.dataset.page === 'marketplace') {
    let category = 'All';
    const bar = document.getElementById('category-bar');
    bar.innerHTML = categories.map(name => `<button class="category-chip${name === 'All' ? ' active' : ''}" type="button" data-category="${escapeHtml(name)}">${escapeHtml(name)}</button>`).join('');
    const query = document.getElementById('search-query');
    const location = document.getElementById('location-filter');
    const min = document.getElementById('min-price'); const max = document.getElementById('max-price'); const verified = document.getElementById('verified-only');
    const render = () => {
      const term = query.value.trim().toLowerCase(); const loc = location.value.toLowerCase();
      const results = allItems().filter(item => (category === 'All' || item.category === category) && (!term || `${item.title} ${item.category} ${item.description}`.toLowerCase().includes(term)) && (!loc || item.location.toLowerCase().includes(loc)) && (!min.value || Number(item.price) >= Number(min.value)) && (!max.value || Number(item.price) <= Number(max.value)) && (!verified.checked || item.verified));
      document.getElementById('listing-grid').innerHTML = results.map(card).join('');
      document.getElementById('result-count').textContent = `${results.length} listings`;
      document.getElementById('results-title').textContent = category === 'All' ? 'All listings' : category;
      document.getElementById('empty-state').hidden = results.length > 0;
    };
    bar.addEventListener('click', event => { const button = event.target.closest('[data-category]'); if (!button) return; category = button.dataset.category; bar.querySelectorAll('.category-chip').forEach(chip => chip.classList.toggle('active', chip === button)); render(); });
    document.getElementById('market-search').addEventListener('submit', event => { event.preventDefault(); render(); });
    [query,location,min,max,verified].forEach(control => control.addEventListener('input', render));
    document.getElementById('clear-filters').addEventListener('click', () => { query.value=''; location.value=''; min.value=''; max.value=''; verified.checked=false; category='All'; bar.querySelectorAll('.category-chip').forEach(chip=>chip.classList.toggle('active',chip.dataset.category==='All')); render(); });
    render();
  }

  if (document.body.dataset.page === 'sell') {
    const form = document.getElementById('sell-form');
    form.addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(form);
      if (data.getAll('photos').filter(file => file.size).length > 5) { alert('Please select up to five item photos.'); return; }
      const listing = {
        id:`local-${Date.now()}`, category:String(data.get('category')), title:String(data.get('title')).trim(), price:Number(data.get('price')),
        negotiable:data.has('negotiable'), condition:String(data.get('condition')), description:String(data.get('description')).trim(),
        sellerName:String(data.get('sellerName')).trim(), phone:String(data.get('phone')).trim(), location:String(data.get('location')).trim(),
        address:String(data.get('address')).trim(), verified:false, memberSince:new Date().getFullYear().toString(), status:'pending',
        reviewMessage:'Your ad is under review. We verify ID in 1-2 hours to protect buyers. You will receive WhatsApp confirmation.'
      };
      // Do not save ID numbers or uploaded ID/selfie/item photos in localStorage. Those are sensitive and require secure server-side handling.
      try { const pending = JSON.parse(localStorage.getItem('pending_items') || '[]'); pending.unshift(listing); localStorage.setItem('pending_items', JSON.stringify(pending)); }
      catch (_) { document.getElementById('sell-status').textContent='Could not save your ad in this browser. Check storage and try again.'; return; }
      form.reset();
      document.getElementById('sell-status').textContent = listing.reviewMessage + ' This demo stores the listing in this browser only; no ID or photo files were uploaded.';
    });
  }

  if (document.body.dataset.page === 'item') {
    const id = new URLSearchParams(location.search).get('id');
    const items = allItems(); const item = items.find(entry => String(entry.id) === String(id));
    const detail = document.getElementById('item-detail');
    if (!item) { detail.innerHTML='<div class="empty-state">This listing could not be found. <a href="marketplace.html">Browse all listings</a>.</div>'; return; }
    const images = item.images && item.images.length ? item.images : [imageUrl(item)];
    const phone = String(item.phone || '').replace(/\D/g,'');
    detail.innerHTML = `<div class="item-detail-layout"><div class="item-gallery"><img id="main-item-photo" class="item-main-photo" src="${escapeHtml(images[0])}" alt="${escapeHtml(item.title)}"><div class="item-thumbnails">${images.map((src,index)=>`<img src="${escapeHtml(src)}" alt="${escapeHtml(item.title)} photo ${index+1}" class="${index===0?'active':''}" data-photo="${index}" onerror="this.style.display='none'">`).join('')}</div></div><article class="item-panel"><p class="item-price">${formatPrice(item.price)}${item.negotiable?' · Negotiable':''}</p><h1>${escapeHtml(item.title)}</h1><p class="listing-location">⌖ ${escapeHtml(item.location)} · ${escapeHtml(item.condition || 'New')}</p><p class="item-description">${escapeHtml(item.description)}</p><section class="seller-box"><h2>Seller information</h2><p><strong>${escapeHtml(item.sellerName || 'DAVELYX Seller')}</strong> ${item.verified?'<span class="verified-badge">✓ Verified</span>':''}</p><p>⌖ ${escapeHtml(item.location)}</p><p>Member since ${escapeHtml(item.memberSince || '2024')}</p></section><section class="safety-box"><h2>Safety tips</h2><p>Meet in a busy public place and inspect the item before paying.</p><p>Never share OTPs or pay in advance if you are unsure about the seller.</p></section><div class="item-actions"><a class="btn btn-gold" href="https://wa.me/234${phone.replace(/^234/,'')}?text=${encodeURIComponent(`Hi, I'm interested in ${item.title}`)}" target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a><button class="btn" id="show-phone" type="button">Show Phone Number</button><div class="phone-number" id="seller-phone" hidden>${escapeHtml(item.phone || 'Contact seller on WhatsApp')}</div></div></article></div>`;
    detail.querySelectorAll('[data-photo]').forEach(thumb => thumb.addEventListener('click', () => { detail.querySelector('#main-item-photo').src=images[Number(thumb.dataset.photo)]; detail.querySelectorAll('[data-photo]').forEach(node=>node.classList.toggle('active',node===thumb)); }));
    document.getElementById('show-phone').addEventListener('click', event => { document.getElementById('seller-phone').hidden=false; event.currentTarget.hidden=true; });
    document.getElementById('similar-items').innerHTML = items.filter(other=>other.id!==item.id && (other.category===item.category || other.location===item.location)).slice(0,3).map(card).join('');
  }
})();
