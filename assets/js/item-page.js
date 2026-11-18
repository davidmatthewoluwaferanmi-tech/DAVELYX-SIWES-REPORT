import { supabase } from './supabase.js';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const id = new URLSearchParams(window.location.search).get('id');
const detail = document.getElementById('item-detail');
const status = document.getElementById('item-status');
let product;

function price(value) {
  return typeof value === 'string' && value.includes('₦') ? value : `₦${Number(value || 0).toLocaleString('en-NG')}`;
}

function draw(item) {
  const images = Array.isArray(item.images) ? item.images : [];
  const image = images[0];
  const phone = String(item.seller_whatsapp || item.phone || '2349035589937').replace(/\D/g, '');
  detail.innerHTML = `<article class="item-detail-layout"><div class="item-gallery">${image ? `<img class="item-main-photo" src="${escapeHtml(image)}" alt="${escapeHtml(item.title)}">` : '<div class="item-main-photo" aria-label="No listing photo">No photo available</div>'}</div><div class="item-info"><span class="eyebrow">${escapeHtml(item.category || 'Marketplace')}</span><h1>${escapeHtml(item.title)}</h1><p class="item-price">${price(item.price)}</p><p>${escapeHtml(item.description || '')}</p><p><strong>Location:</strong> ${escapeHtml(item.location || 'Not specified')}</p><div class="item-actions"><a class="btn btn-gold" href="https://wa.me/${phone}" target="_blank" rel="noopener noreferrer">Contact on WhatsApp</a><button class="btn btn-outline" id="davelyxChatBtn" type="button">Message on DAVELYX</button></div></div></article>`;
  document.getElementById('davelyxChatBtn').addEventListener('click', startChat);
}

async function startChat() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!session) {
      window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
      return;
    }
    if (!product.seller_id) {
      status.textContent = 'This demo listing has no DAVELYX Chat account yet. Use WhatsApp to contact the seller.';
      return;
    }
    if (product.seller_id === session.user.id) {
      status.textContent = 'You cannot start a conversation with your own listing.';
      return;
    }
    status.textContent = 'Opening conversation…';
    const { data, error: conversationError } = await supabase.from('conversations')
      .upsert({ product_id: product.id, buyer_id: session.user.id, seller_id: product.seller_id }, { onConflict: 'product_id,buyer_id' })
      .select('id').single();
    if (conversationError) throw conversationError;
    window.location.href = `chat.html?conversation_id=${encodeURIComponent(data.id)}`;
  } catch (error) {
    console.error('Unable to open listing chat:', error);
    status.textContent = `Unable to open chat: ${error.message}`;
  }
}

(async () => {
  if (!id) {
    detail.innerHTML = '<p>Listing not found. <a href="marketplace.html">Browse listings</a>.</p>';
    return;
  }
  // Product listings are intentionally readable by the anon role; see the public SELECT policy in supabase-schema.sql.
  const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
  if (error) {
    console.error(`Product fetch failed for id ${id}:`, error);
    status.textContent = `Could not load listing: ${error.message}`;
  }
  if (data) product = data;
  if (!product && ['1', '2', '3', '4'].includes(String(id))) {
    const samples = {
      '1': { id: '1', title: 'DAVELYX: SIWES Logbook Printed & Bound - Delivered', price: 12000, category: 'SIWES', location: 'Any Location', description: 'Printed and bound SIWES logbook, delivered.', seller_whatsapp: '2349035589937' },
      '2': { id: '2', title: 'DAVELYX: Mini Powerbank 20000mAh Fast Charge', price: 15000, category: 'Laptops', location: 'Lagos', description: 'Fast-charge 20000mAh mini powerbank.', seller_whatsapp: '2349035589937' },
      '3': { id: '3', title: 'DAVELYX: Student Laptop Stand Adjustable', price: 9500, category: 'Furniture', location: 'Ibadan', description: 'Adjustable laptop stand for students.', seller_whatsapp: '2349035589937' },
      '4': { id: '4', title: 'iPhone 11 64GB Neatly Used', price: 125000, category: 'Phones', location: 'Lagos', description: 'Verified sample listing.', seller_whatsapp: '2349035589937' }
    };
    product = samples[id];
  }
  if (!product) {
    detail.innerHTML = '<p>Listing not found. <a href="marketplace.html">Browse listings</a>.</p>';
    return;
  }
  draw(product);
})();
