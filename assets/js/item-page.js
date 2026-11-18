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
      status.textContent = 'This listing has no DAVELYX Chat account yet. Use WhatsApp to contact the seller.';
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
  // Legacy m-prefixed links refer to retired demo products and are not UUIDs in Supabase.
  if (id.startsWith('m')) {
    detail.innerHTML = '<p>This is a demo listing, not in the database. <a href="index.html#marketplace-section">Browse live listings</a>.</p>';
    return;
  }
  try {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) {
      detail.innerHTML = '<p>Listing not found. <a href="marketplace.html">Browse listings</a>.</p>';
      return;
    }
    product = data;
    draw(product);
  } catch (error) {
    console.error(`Product fetch failed for id ${id}:`, error);
    if (/invalid input syntax for type uuid/i.test(error.message || '')) {
      detail.innerHTML = '<p>This is a demo listing, not in the database. <a href="index.html#marketplace-section">Browse live listings</a>.</p>';
      return;
    }
    status.textContent = `Could not load listing: ${error.message}`;
    detail.innerHTML = '<p>We could not load this listing right now. <a href="marketplace.html">Browse listings</a>.</p>';
  }
})();
