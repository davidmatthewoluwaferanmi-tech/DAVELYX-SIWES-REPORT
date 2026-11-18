import { supabase } from './supabase.js';

if (!document.querySelector('link[href$="assets/css/launch.css"]')) {
  const styles = document.createElement('link');
  styles.rel = 'stylesheet';
  styles.href = 'assets/css/launch.css';
  document.head.appendChild(styles);
}

(async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) console.error('Could not read the current session:', error);
  const nav = document.querySelector('.site-header .nav');
  if (!nav) return;
  nav.querySelector('.marketplace-account-nav')?.remove();
  const actions = document.createElement('div');
  actions.className = 'marketplace-account-nav';
  if (session?.user) {
    const { data: profile, error: profileError } = await supabase.from('profiles').select('display_name,username,avatar_url').eq('id', session.user.id).maybeSingle();
    if (profileError) console.warn('Could not load navigation profile:', profileError.message);
    const rawName = profile?.display_name || profile?.username || session.user.email || 'Account';
    const accountLabel = rawName.includes('@') ? rawName.split('@')[0] : rawName;
    const shortName = accountLabel.length > 14 ? `${accountLabel.slice(0, 12)}…` : accountLabel;
    const avatar = profile?.avatar_url ? `<img src="${String(profile.avatar_url).replace(/["<>]/g, '')}" alt="">` : '';
    actions.innerHTML = `${avatar}<span class="account-name" title="${String(rawName).replace(/["<>]/g, '')}"></span><a href="my-listings.html">My Listings</a><a href="chat.html">Messages</a><a href="sell.html">Sell</a>`;
    actions.querySelector('.account-name').textContent = shortName;
  } else {
    actions.innerHTML = '<a href="login.html">Login</a><a href="sell.html">Sell</a>';
  }
  nav.appendChild(actions);
  nav.querySelectorAll('a[href="sell.html"]').forEach(link => link.addEventListener('click', event => {
    if (!session) { event.preventDefault(); location.href = `login.html?next=${encodeURIComponent('/sell.html')}`; }
  }));
})();
