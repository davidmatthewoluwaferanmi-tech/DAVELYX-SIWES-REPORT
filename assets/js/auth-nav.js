import { supabase } from './supabase.js';
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const style = document.createElement('style'); style.textContent = `.marketplace-account-nav{display:flex;align-items:center;gap:9px;margin-left:auto}.marketplace-account-nav .account-avatar{width:40px;height:40px;min-width:40px;border-radius:50%;object-fit:cover;background:#ddd;display:grid;place-items:center;font-weight:700;color:#333}.account-name{max-width:10ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}.site-header .nav{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.site-header .brand{font-weight:800}.site-header .brand small{font-weight:600}.site-header a{min-height:40px;display:inline-flex;align-items:center}.market-container input,.market-container select,.market-container textarea,form input,form select,form textarea{min-height:44px;border-radius:8px}.mobile-menu-toggle{display:none}@media(max-width:700px){.site-header .nav{gap:8px}.mobile-menu-toggle{display:inline-flex;border:0;background:#f0f2f1;padding:10px;border-radius:8px}.marketplace-account-nav{gap:6px}.marketplace-account-nav>a{font-size:13px}}`; document.head.append(style);
(async () => {
 const { data:{session}, error } = await supabase.auth.getSession(); if(error) console.error(error);
 const nav=document.querySelector('.site-header .nav'); if(!nav)return;
 nav.querySelector('.marketplace-account-nav')?.remove(); const actions=document.createElement('div'); actions.className='marketplace-account-nav';
 if(session?.user){
  let {data:profile,error:pe}=await supabase.from('profiles').select('display_name,username,avatar_url').eq('id',session.user.id).maybeSingle();
  if(pe && /avatar_url|column/i.test(pe.message||'')){const fallback=await supabase.from('profiles').select('display_name,username').eq('id',session.user.id).maybeSingle();profile=fallback.data;}
  const name=profile?.display_name||profile?.username||session.user.user_metadata?.display_name||'Account';
  const label=name.length>10?`${name.slice(0,10)}...`:name;
  actions.innerHTML=`${profile?.avatar_url?`<img class="account-avatar" src="${esc(profile.avatar_url)}" alt="">`:`<span class="account-avatar" aria-label="${esc(name)}">${esc(name.trim().charAt(0).toUpperCase()||'D')}</span>`}<span class="account-name" title="${esc(name)}">${esc(label)}</span><a href="my-listings.html">My Listings</a><a href="chat.html">Messages</a><a href="sell.html">Sell</a><button class="mobile-menu-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false">☰</button>`;
 } else actions.innerHTML='<a href="login.html">Login</a><a href="sell.html">Sell</a>';
 nav.appendChild(actions);
 const toggle=actions.querySelector('.mobile-menu-toggle'); if(toggle)toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')==='true';toggle.setAttribute('aria-expanded',String(!open));nav.classList.toggle('nav-open',!open);});
})();
