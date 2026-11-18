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
  if (!email || !password) {
    status.textContent = 'Enter your email address and password.';
    return;
  }
  status.textContent = 'Signing in…';
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    status.textContent = error.message;
    return;
  }
  if (!data.session) {
    status.textContent = 'Sign-in did not create an authenticated session.';
    return;
  }
  const redirectUrl = safeRedirect(params.get('redirect'));
  window.location.href = redirectUrl || '/';
});
