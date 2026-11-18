import { supabase } from './supabase.js';
const form = document.getElementById('auth-form');
const status = document.getElementById('auth-status');
const params = new URLSearchParams(location.search);
function safeNext(value) { try { const u = new URL(value || '/', location.origin); return u.origin === location.origin ? u.href : '/'; } catch { return '/'; } }
form.addEventListener('submit', async event => {
  event.preventDefault();
  const email = form.elements.email.value.trim(), password = form.elements.password.value;
  if (!email || password.length < 8) { status.textContent = 'Enter a valid email address and a password of at least 8 characters.'; return; }
  status.textContent = 'Creating your account…';
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) { status.textContent = error.message; return; }
  if (!data.session) { status.textContent = 'Account created. Check your email to confirm, then sign in.'; return; }
  const next = safeNext(params.get('next') || params.get('redirect'));
  const { data: profile } = await supabase.from('profiles').select('id').eq('id', data.session.user.id).maybeSingle();
  if (!profile) location.replace(`profile-setup.html?next=${encodeURIComponent(next)}`);
  else location.replace(next);
});
