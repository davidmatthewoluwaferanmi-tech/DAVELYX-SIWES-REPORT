import { supabase } from './supabase.js';
const conversationId=new URLSearchParams(location.search).get('conversation_id');
const status=document.getElementById('chat-status'); const list=document.getElementById('messages'); const form=document.getElementById('message-form');
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
(async()=>{
  if(!conversationId){status.textContent='Conversation not found.';form.hidden=true;return;}
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError||!user){status.textContent='Please sign in from a listing before opening chat.';form.hidden=true;return;}
  const {data:conversation,error}=await supabase.from('conversations').select('id,buyer_id,seller_id,products(title)').eq('id',conversationId).maybeSingle();
  if(error||!conversation){status.textContent=error?.message||'Conversation not found or access denied.';form.hidden=true;return;}
  if(conversation.buyer_id!==user.id&&conversation.seller_id!==user.id){status.textContent='You are not a participant in this conversation.';form.hidden=true;return;}
  status.textContent=`Chat about ${conversation.products?.title||'listing'}`;
  const append=message=>{if(list.querySelector(`[data-message-id="${message.id}"]`))return;const node=document.createElement('div');node.dataset.messageId=message.id;node.style.cssText=`align-self:${message.sender_id===user.id?'flex-end':'flex-start'};max-width:80%;background:${message.sender_id===user.id?'#0D221B':'#f0f0f0'};color:${message.sender_id===user.id?'white':'#222'};padding:10px 14px;border-radius:12px`;node.innerHTML=`<p style="margin:0;white-space:pre-wrap">${escapeHtml(message.text)}</p><small>${new Date(message.created_at).toLocaleString()}</small>`;list.append(node);list.scrollTop=list.scrollHeight;};
  const {data:initial,error:loadError}=await supabase.from('messages').select('id,sender_id,text,created_at').eq('conversation_id',conversationId).order('created_at',{ascending:true});
  if(loadError){status.textContent=loadError.message;form.hidden=true;return;} (initial||[]).forEach(append);
  const channel=supabase.channel('messages').on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:`conversation_id=eq.${conversationId}`},payload=>append(payload.new)).subscribe((state)=>{if(state==='CHANNEL_ERROR'||state==='TIMED_OUT')status.textContent='Live updates unavailable. Reload to check for new messages.';});
  window.addEventListener('beforeunload',()=>supabase.removeChannel(channel));
  form.addEventListener('submit',async event=>{event.preventDefault();const input=document.getElementById('message-text');const text=input.value.trim();if(!text)return;input.disabled=true;const {data:{user:sender},error:authError}=await supabase.auth.getUser();if(authError||!sender||sender.id!==user.id){status.textContent='Your session expired. Sign in again.';input.disabled=false;return;}const {error}=await supabase.from('messages').insert({conversation_id:conversationId,sender_id:sender.id,text});input.disabled=false;if(error){status.textContent=error.message;return;}input.value='';input.focus();});
})();
