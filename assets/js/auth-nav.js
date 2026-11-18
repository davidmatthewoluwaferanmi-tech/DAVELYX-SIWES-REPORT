import { supabase } from './supabase.js';

if (!document.querySelector('link[href$="assets/css/launch.css"]')) {
  const styles = document.createElement('link');
  styles.rel = 'stylesheet';
  styles.href = 'assets/css/launch.css';
  document.head.appendChild(styles);
}

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

(async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) console.error('Could not read the current session:', error);
  const nav = document.querySelector('.site-header .nav');
  if (!nav) return;
  nav.querySelector('.marketplace-account-nav')?.remove();
  const actions = document.createElement('div');
  actions.className = 'marketplace-account-nav';
  if (session?.user) {
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id,display_name,username,avatar_url')
      .eq('id', session.user.id)
      .maybeSingle();
    if (profileError && /avatar_url|column/i.test(profileError.message || '')) {
      const fallback = await supabase.from('profiles').select('id,display_name,username').eq('id', session.user.id).maybeSingle();
      profile = fallback.data;
      profileError = fallback.error;
    }
    if (profileError) console.warn('Could not load navigation profile:', profileError.message);
    const rawName = profile?.display_name || profile?.username || session.user.email || 'Account';
    const accountLabel = rawName.includes('@') ? rawName.split('@')[0] : rawName;
    const shortName = accountLabel.length > 14 ? `${accountLabel.slice(0, 12)}…` : accountLabel;
    const safeName = escapeHtml(rawName);
    const avatar = profile?.avatar_url
      ? `<img src="${escapeHtml(profile.avatar_url)}" class="account-avatar w-8 h-8 rounded-full" alt="${safeName}">`
      : `<span class="account-avatar account-avatar-fallback w-8 h-8 rounded-full" aria-label="${safeName}">${escapeHtml((profile?.display_name || session.user.email || 'D').trim().charAt(0).toUpperCase() || 'D')}</span>`;
    actions.innerHTML = `${avatar}<span class="account-name" title="${safeName}"></span><a href="my-listings.html">My Listings</a><a href="chat.html">Messages</a><a href="sell.html">Sell</a>`;
    actions.querySelector('.account-name').textContent = shortName;
  } else {
    actions.innerHTML = '<a href="login.html">Login</a><a href="sell.html">Sell</a>';
  }
  nav.appendChild(actions);
  nav.querySelectorAll('a[href="sell.html"]').forEach(link => link.addEventListener('click', event => {
    if (!session) { event.preventDefault(); location.href = `login.html?next=${encodeURIComponent('/sell.html')}`; }
  }));
})();

const avatarStyle = document.createElement('style');
avatarStyle.textContent = `.account-avatar{width:32px;height:32px;min-width:32px;border-radius:50%;object-fit:cover}.account-avatar-fallback{display:inline-grid;place-items:center;background:#d9e8df;color:#174b36;font-weight:700}`;
document.head.appendChild(avatarStyle);
