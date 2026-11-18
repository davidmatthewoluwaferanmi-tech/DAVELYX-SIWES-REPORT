import { supabase } from './supabase.js';

const form = document.getElementById('auth-form');
const status = document.getElementById('auth-status');
const params = new URLSearchParams(window.location.search);

function safeRedirect(value) {
  if (!value) return '';
  try {
    const target = new URL(value, window.location.origin);
    if (target.origin === window.location.origin) return target.href;
  } catch (_) {}
  return '';
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;
  if (!email || password.length < 8) {
    status.textContent = 'Enter a valid email address and a password of at least 8 characters.';
    return;
  }
  status.textContent = 'Creating your account…';
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    status.textContent = error.message;
    return;
  }
  if (!data.session) {
    status.textContent = 'Account created. Check your email if confirmation is enabled, then sign in with your password.';
    return;
  }
  const redirectUrl = safeRedirect(params.get('redirect'));
  const profileUrl = new URL('profile.html', window.location.href);
  if (redirectUrl) profileUrl.searchParams.set('redirect', redirectUrl);
  window.location.href = profileUrl.href;
});
