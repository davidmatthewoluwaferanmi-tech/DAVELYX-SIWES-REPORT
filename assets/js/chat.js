import { supabase } from './supabase.js';
const params = new URLSearchParams(location.search), chatId = params.get('chat_id');
const status = document.getElementById('chat-status'), chatList = document.getElementById('chat-list');
const view = document.getElementById('conversation-view'), messages = document.getElementById('messages'), form = document.getElementById('message-form');
const { data: { session }, error: authError } = await supabase.auth.getSession();
if (authError || !session) {
  status.textContent = 'Log in to view your messages.';
  chatList.innerHTML = `<a href="login.html?next=${encodeURIComponent(location.pathname + location.search)}">Log in</a>`;
  form.hidden = true;
} else if (!chatId) {
  const { data: chats, error } = await supabase.from('chats').select('id,product_id,buyer_id,seller_id,last_message,updated_at,products(title)').or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`).order('updated_at', { ascending: false });
  if (error) status.textContent = `Could not load messages: ${error.message}`;
  else if (!chats?.length) status.textContent = 'No messages yet. Browse listings and start a chat with a seller.';
  else {
    status.textContent = '';
    chatList.innerHTML = chats.map(chat => `<a class="chat-list-item" style="display:block;padding:14px;margin:10px 0;background:#fff;border-radius:10px;color:#111827" href="chat.html?chat_id=${encodeURIComponent(chat.id)}&product_id=${encodeURIComponent(chat.product_id)}"><strong>${String(chat.products?.title || 'Listing').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</strong><br>${String(chat.last_message || 'Start the conversation').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</a>`).join('');
  }
  form.hidden = true;
  view.hidden = true;
} else {
  const { data: chat, error } = await supabase.from('chats').select('id,product_id,buyer_id,seller_id,products(title)').eq('id', chatId).maybeSingle();
  if (error || !chat) { status.textContent = error?.message || 'Chat not found.'; form.hidden = true; }
  else if (![chat.buyer_id, chat.seller_id].includes(session.user.id)) { status.textContent = 'You do not have access to this chat.'; form.hidden = true; }
  else {
    status.textContent = ''; view.hidden = false; chatList.hidden = true;
    document.getElementById('conversation-title').textContent = `Chat about ${chat.products?.title || 'listing'}`;
    const append = message => {
      if (messages.querySelector(`[data-id="${message.id}"]`)) return;
      const el = document.createElement('p'); el.dataset.id = message.id; el.textContent = message.content;
      el.style.cssText = `align-self:${message.sender_id === session.user.id ? 'flex-end' : 'flex-start'};padding:10px 14px;border-radius:12px;background:${message.sender_id === session.user.id ? '#0d221b' : '#f1f3f2'};color:${message.sender_id === session.user.id ? 'white' : '#17211d'};max-width:80%;margin:0`;
      messages.appendChild(el); messages.scrollTop = messages.scrollHeight;
    };
    const { data: initial, error: loadError } = await supabase.from('chat_messages').select('id,sender_id,content,created_at').eq('chat_id', chatId).order('created_at');
    if (loadError) status.textContent = `Could not load messages: ${loadError.message}`;
    else (initial || []).forEach(append);
    const channel = supabase.channel(`chat-${chatId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `chat_id=eq.${chatId}` }, payload => append(payload.new)).subscribe();
    window.addEventListener('beforeunload', () => supabase.removeChannel(channel));
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const input = document.getElementById('message-text'), content = input.value.trim();
      if (!content) return;
      const send = form.querySelector('button'); send.disabled = true;
      const { error: sendError } = await supabase.from('chat_messages').insert({ chat_id: chatId, sender_id: session.user.id, content });
      send.disabled = false;
      if (sendError) { status.textContent = `Message failed: ${sendError.message}`; return; }
      const { error: updateError } = await supabase.from('chats').update({ last_message: content, updated_at: new Date().toISOString() }).eq('id', chatId);
      if (updateError) status.textContent = `Message sent, but chat preview could not be updated: ${updateError.message}`;
      input.value = '';
    });
  }
}
