import { supabase } from './supabase.js';

const localUrl = value => {
  try { const url = new URL(value, location.origin); return url.origin === location.origin ? url.href : location.origin + '/'; }
  catch { return location.origin + '/'; }
};

(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const nav = document.querySelector('.site-header .nav');
  if (!nav) return;
  nav.querySelector('.marketplace-account-nav')?.remove();
  const actions = document.createElement('div');
  actions.className = 'marketplace-account-nav';
  if (session?.user) {
    const { data: profile } = await supabase.from('profiles').select('display_name,username,avatar_url').eq('id', session.user.id).maybeSingle();
    const name = profile?.display_name || profile?.username || session.user.email?.split('@')[0] || 'Account';
    const avatar = profile?.avatar_url ? `<img src="${String(profile.avatar_url).replace(/["<>]/g, '')}" alt=""> ` : '';
    actions.innerHTML = `${avatar}<span>${name.replace(/[<>]/g, '')}</span><a href="my-listings.html">My Listings</a><a href="chat.html">Messages</a><a href="sell.html">Sell</a>`;
  } else {
    actions.innerHTML = '<a href="login.html">Login</a><a href="sell.html">Sell</a>';
  }
  nav.appendChild(actions);
  nav.querySelectorAll('a[href="sell.html"]').forEach(link => link.addEventListener('click', event => {
    if (!session) { event.preventDefault(); location.href = `login.html?next=${encodeURIComponent('/sell.html')}`; }
  }));
})();
