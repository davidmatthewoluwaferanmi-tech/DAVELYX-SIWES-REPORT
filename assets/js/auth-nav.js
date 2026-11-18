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
    actions.innerHTML = `${avatar}<span class="account-name" title="${safeName}"></span><a class="messages-nav-link" href="chat.html" aria-label="Messages"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z"/></svg><span>Messages</span><span class="messages-unread-badge" aria-live="polite" hidden></span></a><a href="my-listings.html">My Listings</a><a href="sell.html">Sell</a>`;
    actions.querySelector('.account-name').textContent = shortName;
    const badge = actions.querySelector('.messages-unread-badge');
    const refreshUnread = async () => {
      const { count, error: unreadError } = await supabase.from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', session.user.id);
      if (unreadError) {
        // Existing deployments without the optional read marker simply show no badge.
        if (!/is_read|column/i.test(unreadError.message || '')) console.warn('Could not load unread message count:', unreadError.message);
        badge.hidden = true;
        return;
      }
      badge.textContent = count > 99 ? '99+' : String(count || 0);
      badge.hidden = !count;
    };
    await refreshUnread();
    const unreadChannel = supabase.channel(`unread-messages-${session.user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, refreshUnread)
      .subscribe();
    window.addEventListener('beforeunload', () => supabase.removeChannel(unreadChannel));
  } else {
    actions.innerHTML = '<a href="login.html">Login</a><a href="sell.html">Sell</a>';
  }
  nav.appendChild(actions);
  nav.querySelectorAll('a[href="sell.html"]').forEach(link => link.addEventListener('click', event => {
    if (!session) { event.preventDefault(); location.href = `login.html?next=${encodeURIComponent('/sell.html')}`; }
  }));
})();

const avatarStyle = document.createElement('style');
avatarStyle.textContent = `.account-avatar{width:32px;height:32px;min-width:32px;border-radius:50%;object-fit:cover}.account-avatar-fallback{display:inline-grid;place-items:center;background:#d9e8df;color:#174b36;font-weight:700}.messages-nav-link{position:relative;display:inline-flex;align-items:center;gap:6px;min-height:40px}.messages-unread-badge{display:inline-grid;place-items:center;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#d93025;color:#fff;font-size:11px;font-weight:700;line-height:1}.messages-unread-badge[hidden]{display:none}@media(max-width:700px){.messages-nav-link{gap:4px}}`;
document.head.appendChild(avatarStyle);
