import { supabase } from './supabase.js';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]));
const id = new URLSearchParams(location.search).get('id');
const detail = document.getElementById('item-detail');
const status = document.getElementById('item-status');
let product;
const price = value => typeof value === 'string' && value.includes('₦') ? value : `₦${Number(value || 0).toLocaleString('en-NG')}`;
function getWhatsAppLink(phone) {
  let clean = String(phone || '').replace(/\D/g, '');
  if (clean.startsWith('0')) clean = '234' + clean.slice(1);
  if (clean.startsWith('+')) clean = clean.slice(1);
  if (!clean) return '';
  return `https://wa.me/${clean}?text=${encodeURIComponent('Hi, I saw your product on Davelyx')}`;
}
function draw(item, isOwner = false) {
  const image = Array.isArray(item.images) ? item.images[0] : '';
  const phone = item.seller_whatsapp || item.phone || '';
  const whatsappLink = getWhatsAppLink(phone);
  const banner = isOwner ? `<div id="owner-banner"><p>✅ Your listing is live!</p><div style="display:flex;gap:10px;flex-wrap:wrap"><a id="view-product-btn" href="#product-details">View Product</a><button id="share-link-btn" type="button">Share Your Product Link</button><a id="share-wa-btn" target="_blank" rel="noopener noreferrer" href="#">Share on WhatsApp</a></div><p id="share-product-status" role="status"></p></div>` : '';
  detail.innerHTML = `${banner}<article class="item-detail-layout" id="product-details"><div class="item-gallery">${image ? `<img class="item-main-photo" src="${escapeHtml(image)}" alt="${escapeHtml(item.title)}">` : '<div class="item-main-photo">No photo available</div>'}</div><div class="item-info"><span class="eyebrow">${escapeHtml(item.category || 'Marketplace')}</span><h1>${escapeHtml(item.title)}</h1><p class="item-price">${price(item.price)}</p><p>${escapeHtml(item.description || '')}</p><p><strong>Location:</strong> ${escapeHtml(item.location || 'Not specified')}</p><div style="display:flex;flex-direction:column;gap:12px;margin-top:20px"><button id="davelyx-chat-btn" type="button" style="width:100%;height:52px;background:#111827;color:white;border:0;border-radius:12px;font-weight:700">Message on DAVELYX</button>${whatsappLink ? `<a id="whatsapp-btn" href="${escapeHtml(whatsappLink)}" target="_blank" rel="noopener noreferrer" style="width:100%;height:52px;background:#facc15;color:#111827;border-radius:12px;font-weight:700;display:flex;align-items:center;justify-content:center;text-decoration:none">Chat on WhatsApp</a>` : ''}</div></div></article>`;
  document.getElementById('davelyx-chat-btn').addEventListener('click', startChat);
  if (isOwner) {
    const shareStatus = document.getElementById('share-product-status');
    document.getElementById('share-wa-btn').href = `https://wa.me/?text=${encodeURIComponent(`Check my product on DAVELYX: ${location.href}`)}`;
    document.getElementById('share-link-btn').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(location.href); shareStatus.textContent = 'Link copied! Share on WhatsApp'; }
      catch (error) { shareStatus.textContent = `Could not copy link: ${error.message}`; }
    });
  }
}
async function startChat() {
  const button = document.getElementById('davelyx-chat-btn');
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError) { status.textContent = `Could not verify sign-in: ${authError.message}`; return; }
  if (!session) { location.href = `login.html?next=${encodeURIComponent(location.pathname + location.search)}`; return; }
  if (!product.seller_id || product.seller_id === session.user.id) { status.textContent = product.seller_id ? 'You cannot chat about your own listing.' : 'Seller chat is unavailable for this listing.'; return; }
  button.disabled = true; button.textContent = 'Opening message…'; status.textContent = 'Opening message…';
  try {
    const { data: existing, error: findError } = await supabase.from('chats').select('id').eq('product_id', product.id).eq('buyer_id', session.user.id).maybeSingle();
    if (findError) throw findError;
    let chat = existing;
    if (!chat) {
      const { data, error } = await supabase.from('chats').insert({ product_id: product.id, buyer_id: session.user.id, seller_id: product.seller_id, last_message: '' }).select('id').single();
      if (error) throw error;
      chat = data;
      // chat_messages references participants and listing through chat_id; keep
      // the canonical foreign-key schema and create an opening message for the seller.
      const content = `Hi, I'm interested in ${product.title || 'this listing'}.`;
      const { error: messageError } = await supabase.from('chat_messages').insert({ chat_id: chat.id, sender_id: session.user.id, content });
      if (messageError) throw messageError;
      const { error: updateError } = await supabase.from('chats').update({ last_message: content, updated_at: new Date().toISOString() }).eq('id', chat.id);
      if (updateError && !/updated_at|column/i.test(updateError.message || '')) throw updateError;
    }
    location.href = `chat.html?chat_id=${encodeURIComponent(chat.id)}&product_id=${encodeURIComponent(product.id)}`;
  } catch (error) {
    console.error('Unable to open chat:', error); status.textContent = `Could not open chat: ${error.message}`;
    button.disabled = false; button.textContent = 'Message on DAVELYX';
  }
}
(async () => {
  if (!id) { detail.innerHTML = '<p>Listing not found. <a href="marketplace.html">Browse listings</a>.</p>'; return; }
  try {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) { detail.innerHTML = '<p>Listing not found. <a href="marketplace.html">Browse listings</a>.</p>'; return; }
    product = data;
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) throw authError;
    draw(product, Boolean(session && product.seller_id === session.user.id));
  } catch (error) { status.textContent = `Could not load listing: ${error.message}`; detail.innerHTML = '<p>We could not load this listing. <a href="marketplace.html">Browse listings</a>.</p>'; }
})();
