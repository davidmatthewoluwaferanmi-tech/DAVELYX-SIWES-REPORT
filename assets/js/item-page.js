import { supabase } from './supabase.js';

const contrastStyles = document.createElement('link');
contrastStyles.rel = 'stylesheet';
contrastStyles.href = 'assets/css/marketplace-contrast.css';
document.head.appendChild(contrastStyles);

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
  const ownerBanner = isOwner ? `<section class="owner-listing-banner" aria-label="Your listing is live"><strong>✅ Your listing is live!</strong><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px"><a class="btn" id="product-page-link" href="#product-details">View Product</a><button class="btn" id="share-product-link" type="button">Share Your Product Link</button><a class="btn" id="share-product-whatsapp" href="#" target="_blank" rel="noopener noreferrer" hidden>Share on WhatsApp</a></div><p id="share-product-status" role="status" aria-live="polite" style="margin-bottom:0"></p></section>` : '';
  detail.innerHTML = `${ownerBanner}<article class="item-detail-layout" id="product-details"><div class="item-gallery">${image ? `<img class="item-main-photo" src="${escapeHtml(image)}" alt="${escapeHtml(item.title)}">` : '<div class="item-main-photo" aria-label="No listing photo">No photo available</div>'}</div><div class="item-info"><span class="eyebrow">${escapeHtml(item.category || 'Marketplace')}</span><h1>${escapeHtml(item.title)}</h1><p class="item-price">${price(item.price)}</p><p>${escapeHtml(item.description || '')}</p><p><strong>Location:</strong> ${escapeHtml(item.location || 'Not specified')}</p><div class="item-actions"><button class="btn" id="davelyxChatBtn" type="button">Chat on DAVELYX</button><a class="btn" id="contactSellerWhatsApp" href="https://wa.me/${phone}" target="_blank" rel="noopener noreferrer">Contact on WhatsApp</a></div></div></article>`;
  document.getElementById('davelyxChatBtn').addEventListener('click', startChat);

  if (isOwner) {
    const shareButton = document.getElementById('share-product-link');
    const shareStatus = document.getElementById('share-product-status');
    const whatsappButton = document.getElementById('share-product-whatsapp');
    whatsappButton.href = `https://wa.me/?text=${encodeURIComponent(`Check my product on DAVELYX: ${window.location.href}`)}`;
    shareButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        shareStatus.textContent = 'Link copied! Share on WhatsApp';
        whatsappButton.hidden = false;
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
