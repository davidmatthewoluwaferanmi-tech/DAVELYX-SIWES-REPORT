import { supabase } from './supabase.js';

const conversationId = new URLSearchParams(window.location.search).get('conversation_id');
const status = document.getElementById('chat-status');
const list = document.getElementById('messages');
const form = document.getElementById('message-form');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

(async () => {
  if (!conversationId) {
    status.textContent = 'Conversation not found.';
    form.hidden = true;
    return;
  }
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  const user = session?.user;
  if (sessionError || !user) {
    status.textContent = 'Please log in to open this conversation.';
    form.hidden = true;
    return;
  }
  const { data: conversation, error } = await supabase.from('conversations')
    .select('id,buyer_id,seller_id,products(title)').eq('id', conversationId).maybeSingle();
  if (error || !conversation) {
    status.textContent = error?.message || 'Conversation not found or access denied.';
    form.hidden = true;
    return;
  }
  if (conversation.buyer_id !== user.id && conversation.seller_id !== user.id) {
    status.textContent = 'You are not a participant in this conversation.';
    form.hidden = true;
    return;
  }
  status.textContent = `Chat about ${conversation.products?.title || 'listing'}`;
  const append = message => {
    if (list.querySelector(`[data-message-id="${message.id}"]`)) return;
    const node = document.createElement('div');
    node.dataset.messageId = message.id;
    node.style.cssText = `align-self:${message.sender_id === user.id ? 'flex-end' : 'flex-start'};max-width:80%;padding:10px 14px;border-radius:12px;background:${message.sender_id === user.id ? '#e7f5eb' : '#f1f1f1'}`;
    node.textContent = message.text;
    list.appendChild(node);
    list.scrollTop = list.scrollHeight;
  };
  const { data: initial, error: loadError } = await supabase.from('messages')
    .select('id,sender_id,text,created_at').eq('conversation_id', conversationId).order('created_at', { ascending: true });
  if (loadError) {
    status.textContent = loadError.message;
    form.hidden = true;
    return;
  }
  (initial || []).forEach(append);
  const channel = supabase.channel(`messages-${conversationId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, payload => append(payload.new))
    .subscribe();
  window.addEventListener('beforeunload', () => supabase.removeChannel(channel));
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const input = document.getElementById('message-text');
    const text = input.value.trim();
    if (!text || text.length > 5000) return;
    input.disabled = true;
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession || currentSession.user.id !== user.id) {
      status.textContent = 'Your sign-in expired. Please log in again.';
      input.disabled = false;
      return;
    }
    const { error: sendError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentSession.user.id,
      text
    });
    input.disabled = false;
    if (sendError) {
      status.textContent = sendError.message;
      return;
    }
    input.value = '';
  });
})();
