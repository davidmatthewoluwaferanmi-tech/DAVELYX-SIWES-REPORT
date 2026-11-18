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

function draw(item, isOwner = false) {
  const images = Array.isArray(item.images) ? item.images : [];
  const image = images[0];
  const phone = String(item.seller_whatsapp || item.phone || '2349035589937').replace(/\D/g, '');
  const ownerBanner = isOwner ? `<div id="owner-banner"><p style="color:#166534;font-weight:700;margin:0 0 12px 0">✅ Your listing is live!</p><div style="display:flex;gap:10px;flex-wrap:wrap"><a id="view-product-btn" href="#product-details" style="background:#111827;color:white;padding:10px 18px;border-radius:8px;font-weight:600;text-decoration:none">View Product</a><button id="share-link-btn" type="button" style="background:white;color:#111827;border:1px solid #111827;padding:10px 18px;border-radius:8px;font-weight:600">Share Your Product Link</button><a id="share-wa-btn" href="#" style="background:#25D366;color:white;padding:10px 18px;border-radius:8px;font-weight:600;text-decoration:none">Share on WhatsApp</a></div><p id="share-product-status" role="status" aria-live="polite" style="margin-bottom:0"></p></div>` : '';
  detail.innerHTML = `${ownerBanner}<article class="item-detail-layout" id="product-details"><div class="item-gallery">${image ? `<img class="item-main-photo" src="${escapeHtml(image)}" alt="${escapeHtml(item.title)}">` : '<div class="item-main-photo" aria-label="No listing photo">No photo available</div>'}</div><div class="item-info"><span class="eyebrow">${escapeHtml(item.category || 'Marketplace')}</span><h1>${escapeHtml(item.title)}</h1><p class="item-price">${price(item.price)}</p><p>${escapeHtml(item.description || '')}</p><p><strong>Location:</strong> ${escapeHtml(item.location || 'Not specified')}</p><div style="display:flex;flex-direction:column;gap:12px;margin-top:20px"><button id="davelyx-chat-btn" type="button" style="width:100%;height:52px;background:#111827;color:white;border:none;border-radius:12px;font-weight:700;font-size:16px;cursor:pointer">Message on DAVELYX</button><a id="whatsapp-btn" href="#" style="width:100%;height:52px;background:#facc15;color:#111827;border:none;border-radius:12px;font-weight:700;font-size:16px;display:flex;align-items:center;justify-content:center;text-decoration:none">Contact on WhatsApp</a></div></div></article>`;
  document.getElementById('davelyx-chat-btn').addEventListener('click', startChat);
  document.getElementById('whatsapp-btn').href = `https://wa.me/${phone}`;

  if (isOwner) {
    const shareButton = document.getElementById('share-link-btn');
    const shareStatus = document.getElementById('share-product-status');
    const whatsappButton = document.getElementById('share-wa-btn');
    whatsappButton.href = `https://wa.me/?text=${encodeURIComponent(`Check my product on DAVELYX: ${window.location.href}`)}`;
    whatsappButton.target = '_blank';
    whatsappButton.rel = 'noopener noreferrer';
    shareButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        shareStatus.textContent = 'Link copied! Share on WhatsApp';
      } catch (error) {
        console.error('Unable to copy product link:', error);
        shareStatus.textContent = 'Could not copy the link. Please copy the page URL to share it.';
      }
    });
  }
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
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    draw(product, Boolean(session && product.seller_id && session.user.id === product.seller_id));
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
