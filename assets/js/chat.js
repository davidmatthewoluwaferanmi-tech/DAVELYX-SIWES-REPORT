import { supabase, isSupabaseConfigured } from './supabase.js';
const conversationId=new URLSearchParams(location.search).get('conversation_id');
const status=document.getElementById('chat-status'); const list=document.getElementById('messages'); const form=document.getElementById('message-form');
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(!isSupabaseConfigured){status.textContent='Set Supabase URL and anon key in assets/js/supabase.js to enable real chat.';form.hidden=true;}
else if(!conversationId){status.textContent='Conversation not found.';form.hidden=true;}
else (async()=>{
  const {data:{session},error:sessionError}=await supabase.auth.getSession();
  if(sessionError||!session){status.textContent='Please sign in from a listing before opening chat.';form.hidden=true;return;}
  const {data:conversation,error}=await supabase.from('conversations').select('id,buyer_id,seller_id,products(title)').eq('id',conversationId).maybeSingle();
  if(error||!conversation){status.textContent=error?.message||'Conversation not found or access denied.';form.hidden=true;return;}
  status.textContent=`Chat about ${conversation.products?.title||'listing'}`;
  const render=messages=>{list.innerHTML=messages.map(message=>`<div style="align-self:${message.sender_id===session.user.id?'flex-end':'flex-start'};max-width:80%;background:${message.sender_id===session.user.id?'#0D221B':'#f0f0f0'};color:${message.sender_id===session.user.id?'white':'#222'};padding:10px 14px;border-radius:12px"><p style="margin:0;white-space:pre-wrap">${escapeHtml(message.text)}</p><small>${new Date(message.created_at).toLocaleString()}</small></div>`).join('');list.scrollTop=list.scrollHeight;};
  const {data:initial,error:loadError}=await supabase.from('messages').select('id,sender_id,text,created_at').eq('conversation_id',conversationId).order('created_at',{ascending:true});
  if(loadError){status.textContent=loadError.message;return;} render(initial||[]);
  supabase.channel(`conversation-${conversationId}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:`conversation_id=eq.${conversationId}`},payload=>{const message=payload.new;if(!list.querySelector(`[data-message-id="${message.id}"]`)){const node=document.createElement('div');node.dataset.messageId=message.id;node.style.cssText=`align-self:${message.sender_id===session.user.id?'flex-end':'flex-start'};max-width:80%;background:${message.sender_id===session.user.id?'#0D221B':'#f0f0f0'};color:${message.sender_id===session.user.id?'white':'#222'};padding:10px 14px;border-radius:12px`;node.innerHTML=`<p style="margin:0;white-space:pre-wrap">${escapeHtml(message.text)}</p><small>${new Date(message.created_at).toLocaleString()}</small>`;list.append(node);list.scrollTop=list.scrollHeight;}}).subscribe();
  form.addEventListener('submit',async event=>{event.preventDefault();const input=document.getElementById('message-text');const text=input.value.trim();if(!text)return;input.disabled=true;const {error}=await supabase.from('messages').insert({conversation_id:conversationId,sender_id:session.user.id,text});input.disabled=false;if(error){status.textContent=error.message;return;}input.value='';input.focus();});
})();
