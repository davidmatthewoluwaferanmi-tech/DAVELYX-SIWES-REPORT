import { supabase } from './supabase.js';
const params = new URLSearchParams(location.search), chatId = params.get('chat_id');
const status = document.getElementById('chat-status'), chatList = document.getElementById('chat-list');
const view = document.getElementById('conversation-view'), messages = document.getElementById('messages'), form = document.getElementById('message-form');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const { data: { session }, error: authError } = await supabase.auth.getSession();
if (authError || !session) { status.textContent = 'Log in to view your messages.'; chatList.innerHTML = `<a href="login.html?next=${encodeURIComponent(location.pathname + location.search)}">Log in</a>`; form.hidden = true; }
else if (!chatId) {
  const { data: chats, error } = await supabase.from('chats').select('id,product_id,buyer_id,seller_id,last_message,updated_at,products(title)').or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`).order('updated_at', { ascending: false });
  if (error) status.textContent = `Could not load messages: ${error.message}`;
  else if (!chats?.length) status.textContent = 'No messages yet. Browse listings and start a chat with a seller.';
  else { status.textContent = ''; chatList.innerHTML = chats.map(c => `<a class="chat-list-item" style="display:block;padding:14px;margin:10px 0;background:#fff;border-radius:10px;color:#111827" href="chat.html?chat_id=${encodeURIComponent(c.id)}&product_id=${encodeURIComponent(c.product_id)}"><strong>${escapeHtml(c.products?.title || 'Listing')}</strong><br>${escapeHtml(c.last_message || 'Start the conversation')}</a>`).join(''); }
  form.hidden = true; view.hidden = true;
} else {
  const { data: chat, error } = await supabase.from('chats').select('id,product_id,buyer_id,seller_id,products(title)').eq('id', chatId).maybeSingle();
  if (error || !chat) { status.textContent = error?.message || 'Chat not found.'; form.hidden = true; }
  else if (![chat.buyer_id, chat.seller_id].includes(session.user.id)) { status.textContent = 'You do not have access to this chat.'; form.hidden = true; }
  else {
    status.textContent = ''; view.hidden = false; chatList.hidden = true;
    document.getElementById('conversation-title').textContent = `Chat about ${chat.products?.title || 'listing'}`;
    const append = m => { if (messages.querySelector(`[data-id="${m.id}"]`)) return; const el = document.createElement('p'); el.dataset.id=m.id; el.textContent=m.body; el.style.cssText=`align-self:${m.sender_id === session.user.id?'flex-end':'flex-start'};padding:10px 14px;border-radius:12px;background:${m.sender_id === session.user.id?'#d8f3dc':'#f1f3f1'}`; messages.appendChild(el); };
    const { data: initial, error: loadError } = await supabase.from('chat_messages').select('id,sender_id,body,created_at').eq('chat_id', chatId).order('created_at');
    if (loadError) status.textContent = `Could not load messages: ${loadError.message}`; else (initial || []).forEach(append);
    const channel = supabase.channel(`chat-${chatId}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'chat_messages',filter:`chat_id=eq.${chatId}`},payload=>append(payload.new)).subscribe();
    window.addEventListener('beforeunload',()=>supabase.removeChannel(channel));
    form.addEventListener('submit',async e=>{e.preventDefault();const input=document.getElementById('message-text'), body=input.value.trim();if(!body)return;const send=form.querySelector('button');send.disabled=true;const {error:sendError}=await supabase.from('chat_messages').insert({chat_id:chatId,sender_id:session.user.id,body});send.disabled=false;if(sendError){status.textContent=`Message failed: ${sendError.message}`;return;}await supabase.from('chats').update({last_message:body,updated_at:new Date().toISOString()}).eq('id',chatId);input.value='';});
  }
}
