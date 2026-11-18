import { supabase } from './supabase.js';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const mockItems = [
  { id: '1', title: 'DAVELYX: SIWES Logbook Printed & Bound - Delivered', price: 12000, category: 'SIWES', location: 'Any Location', description: 'Printed and bound SIWES logbook, delivered.', seller_whatsapp: '2349035589937', is_official: true },
  { id: '2', title: 'DAVELYX: Mini Powerbank 20000mAh Fast Charge', price: 15000, category: 'Laptops', location: 'Lagos', description: 'Fast-charge 20000mAh mini powerbank.', seller_whatsapp: '2349035589937', is_official: true },
  { id: '3', title: 'DAVELYX: Student Laptop Stand Adjustable', price: 9500, category: 'Furniture', location: 'Ibadan', description: 'Adjustable laptop stand for students.', seller_whatsapp: '2349035589937', is_official: true },
  { id: '4', title: 'iPhone 11 64GB Neatly Used', price: 125000, category: 'Phones', location: 'Lagos', description: 'Verified sample listing.', seller_whatsapp: '2349035589937', is_featured: true }
];
const id = new URLSearchParams(window.location.search).get('id');
const detail = document.getElementById('item-detail');
const status = document.getElementById('item-status');
let product;
let sessionUser;

function price(value) {
  return typeof value === 'string' && value.includes('₦') ? value : `₦${Number(value || 0).toLocaleString('en-NG')}`;
}

function draw(item) {
  const image = item.images?.[0];
  const phone = String(item.seller_whatsapp || item.phone || '2349035589937').replace(/\D/g, '');
  detail.innerHTML = `<article class="item-detail-layout"><div class="item-gallery">${image ? `<img class="item-main-photo" src="${escapeHtml(image)}" alt="${escapeHtml(item.title)}">` : '<div class="item-main-photo" style="display:grid;place-items:center;background:#f2f2f2;font-size:64px">🛍️</div>'}</div><div><span class="eyebrow">${item.is_official ? 'DAVELYX OFFICIAL STORE' : item.is_featured ? 'FEATURED' : 'Marketplace listing'}</span><h1>${escapeHtml(item.title)}</h1><p style="font-size:28px;font-weight:800">${escapeHtml(price(item.price))}</p><p>${escapeHtml(item.description || '')}</p><p>${escapeHtml(item.location || '')}</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button id="davelyxChatBtn" class="btn btn-gold" type="button">💬 Chat with seller</button><a class="btn btn-outline" target="_blank" rel="noopener noreferrer" href="https://wa.me/${phone}?text=${encodeURIComponent(`Hi, I'm interested in ${item.title} listed for ${price(item.price)} on DAVELYX Marketplace`)}">Chat on WhatsApp (Optional)</a></div></div></article>`;
  document.getElementById('davelyxChatBtn').addEventListener('click', startChat);
}

async function startChat() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
      return;
    }
    sessionUser = session.user;
    await createConversation(session.user.id);
  } catch (error) {
    status.textContent = `Unable to open chat: ${error.message}`;
  }
}

async function createConversation(userId) {
  if (!product.seller_id) {
    status.textContent = 'This sample listing has no DAVELYX Chat account yet. Use WhatsApp to contact the seller.';
    return;
  }
  if (product.seller_id === userId) {
    status.textContent = 'You cannot start a conversation with your own listing.';
    return;
  }
  status.textContent = 'Opening conversation…';
  const { data, error } = await supabase.from('conversations')
    .upsert({ product_id: product.id, buyer_id: userId, seller_id: product.seller_id }, { onConflict: 'product_id,buyer_id' })
    .select('id').single();
  if (error) {
    status.textContent = error.message;
    return;
  }
  window.location.href = `chat.html?conversation_id=${encodeURIComponent(data.id)}`;
}

(async () => {
  if (!id) {
    detail.innerHTML = '<p>Listing not found. <a href="marketplace.html">Browse listings</a>.</p>';
    return;
  }
  const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
  if (!error && data) product = data;
  if (!product) product = mockItems.find(item => String(item.id) === String(id));
  if (!product) {
    detail.innerHTML = '<p>Listing not found. <a href="marketplace.html">Browse listings</a>.</p>';
    return;
  }
  draw(product);
})();
