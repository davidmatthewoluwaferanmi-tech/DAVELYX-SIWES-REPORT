import { supabase } from './supabase.js';
import { avatarMarkup } from './config.js';
const params = new URLSearchParams(location.search), chatId = params.get('chat_id');
const status = document.getElementById('chat-status'), chatList = document.getElementById('chat-list');
const view = document.getElementById('conversation-view'), messages = document.getElementById('messages'), form = document.getElementById('message-form');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const timeAgo = value => { const n = Math.max(0, (Date.now() - new Date(value || Date.now()).getTime()) / 1000); return n < 60 ? 'just now' : n < 3600 ? `${Math.floor(n/60)}m ago` : n < 86400 ? `${Math.floor(n/3600)}h ago` : `${Math.floor(n/86400)}d ago`; };
const { data: { session }, error: authError } = await supabase.auth.getSession();
if (authError || !session) {
  status.textContent = 'Log in to view your messages.';
  chatList.innerHTML = `<a href="login.html?next=${encodeURIComponent(location.pathname + location.search)}">Log in</a>`;
  form.hidden = true;
} else if (!chatId) {
  let query = supabase.from('chats').select('id,product_id,buyer_id,seller_id,last_message,updated_at,products(title,images)');
  const { data: chats, error } = await query.or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`).order('updated_at', { ascending: false });
  if (error) status.textContent = `Could not load messages: ${error.message}`;
  else if (!chats?.length) {
    status.innerHTML = '<div class="messages-empty"><div class="empty-illustration" aria-hidden="true">💬</div><strong>No messages yet</strong><p>Start chatting from a product page.</p><a href="marketplace.html">Browse listings</a></div>';
  } else {
    const otherIds = [...new Set(chats.map(c => c.buyer_id === session.user.id ? c.seller_id : c.buyer_id))];
    let profiles = [];
    if (otherIds.length) {
      let result = await supabase.from('profiles').select('id,display_name,username,avatar_url').in('id', otherIds);
      if (result.error && /avatar_url|column/i.test(result.error.message || '')) result = await supabase.from('profiles').select('id,display_name,username').in('id', otherIds);
      profiles = result.data || [];
    }
    const byId = Object.fromEntries(profiles.map(p => [p.id, p]));
    const unread = await Promise.all(chats.map(async c => {
      try { const { count } = await supabase.from('chat_messages').select('id', { count:'exact', head:true }).eq('chat_id', c.id).neq('sender_id', session.user.id); return count || 0; } catch { return 0; }
    }));
    status.textContent = '';
    chatList.innerHTML = chats.map((c, i) => {
      const p = byId[c.buyer_id === session.user.id ? c.seller_id : c.buyer_id] || {};
      const name = p.display_name || p.username || 'DAVELYX member';
      const image = c.products?.images?.[0] || '';
      return `<a class="chat-list-item" href="chat.html?chat_id=${encodeURIComponent(c.id)}&product_id=${encodeURIComponent(c.product_id)}"><span class="chat-person">${avatarMarkup(p.avatar_url,name,'chat-avatar')}<span><strong>${esc(name)}</strong><small>${esc(c.products?.title || 'Listing')} · ${timeAgo(c.updated_at)}</small><span>${esc(c.last_message || 'Start the conversation')}</span></span></span>${image ? `<img class="chat-product-thumb" src="${esc(image)}" alt="">` : ''}${unread[i] ? `<b class="unread-badge" aria-label="${unread[i]} unread messages">${unread[i]}</b>` : ''}</a>`;
    }).join('');
  }
  form.hidden = true; view.hidden = true;
} else {
  let { data: chat, error } = await supabase.from('chats').select('id,product_id,buyer_id,seller_id,products(title)').eq('id', chatId).maybeSingle();
  if (error || !chat) { status.textContent = error?.message || 'Chat not found.'; form.hidden = true; }
  else if (![chat.buyer_id, chat.seller_id].includes(session.user.id)) { status.textContent = 'You do not have access to this chat.'; form.hidden = true; }
  else {
    status.textContent = ''; view.hidden = false; chatList.hidden = true;
    document.getElementById('conversation-title').textContent = `Chat about ${chat.products?.title || 'listing'}`;
    const append = message => {
      if (messages.querySelector(`[data-id="${CSS.escape(String(message.id))}"]`)) return;
      const el = document.createElement('p'); el.dataset.id = message.id; el.textContent = message.content;
      el.style.cssText = `align-self:${message.sender_id === session.user.id ? 'flex-end' : 'flex-start'};padding:10px 14px;border-radius:12px;background:${message.sender_id === session.user.id ? '#0d221b' : '#f1f3f2'};color:${message.sender_id === session.user.id ? 'white' : '#17211d'};max-width:80%;margin:0`;
      messages.appendChild(el); messages.scrollTop = messages.scrollHeight;
    };
    const { data: initial, error: loadError } = await supabase.from('chat_messages').select('id,sender_id,content,created_at').eq('chat_id', chatId).order('created_at');
    if (loadError) status.textContent = `Could not load messages: ${loadError.message}`; else (initial || []).forEach(append);
    const channel = supabase.channel(`chat-${chatId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `chat_id=eq.${chatId}` }, payload => append(payload.new)).subscribe();
    window.addEventListener('beforeunload', () => supabase.removeChannel(channel));
    form.addEventListener('submit', async event => {
      event.preventDefault(); const input = document.getElementById('message-text'), content = input.value.trim(); if (!content) return;
      const send = form.querySelector('button'); send.disabled = true;
      try {
        const { error: sendError } = await supabase.from('chat_messages').insert({ chat_id: chatId, sender_id: session.user.id, content });
        if (sendError) throw sendError;
        const { error: updateError } = await supabase.from('chats').update({ last_message: content, updated_at: new Date().toISOString() }).eq('id', chatId);
        if (updateError && !/updated_at|column/i.test(updateError.message || '')) throw updateError;
        input.value = ''; status.textContent = '';
      } catch (e) { status.textContent = `Message failed: ${e.message}`; }
      finally { send.disabled = false; }
    });
  }
}
const style = document.createElement('style'); style.textContent = `.chat-list-item{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px;margin:10px 0;background:#fff;border-radius:12px;color:#111827;text-decoration:none;border:1px solid #e8ece9}.chat-person{display:flex;align-items:center;gap:12px}.chat-person>span:last-child{display:grid;gap:4px}.chat-person small{color:#69736e}.chat-avatar,.avatar{width:40px;height:40px;border-radius:50%;object-fit:cover}.avatar-fallback{display:inline-grid;place-items:center;background:#ddd;color:#333;font-weight:700}.chat-product-thumb{width:48px;height:48px;object-fit:cover;border-radius:8px}.unread-badge{background:#ff6a00;color:white;border-radius:20px;padding:3px 8px}.messages-empty{text-align:center;padding:56px 18px;background:#fff;border-radius:16px}.empty-illustration{font-size:48px;margin-bottom:12px}`; document.head.append(style);
