import { supabase } from './supabase.js';

const form = document.getElementById('profile-form');
const status = document.getElementById('profile-status');
const avatarPreview = document.getElementById('avatar-preview');
const params = new URLSearchParams(window.location.search);

function safeRedirect(value) {
  if (!value) return '';
  try {
    const target = new URL(value, window.location.origin);
    if (target.origin === window.location.origin) return target.href;
  } catch (_) {}
  return '';
}

const redirectUrl = safeRedirect(params.get('redirect'));
let userId;

function setAvatarPreview(url) {
  avatarPreview.src = url || 'https://placehold.co/160x160?text=Avatar';
}

const { data: { session }, error: sessionError } = await supabase.auth.getSession();
if (sessionError || !session) {
  const loginUrl = new URL('login.html', window.location.href);
  loginUrl.searchParams.set('redirect', window.location.href);
  window.location.replace(loginUrl.href);
} else {
  userId = session.user.id;
  const { data, error } = await supabase.from('profiles').select('username, phone, location, avatar_url').eq('id', userId).maybeSingle();
  if (error) {
    console.error('Unable to load profile:', error);
    status.textContent = `Could not load your profile: ${error.message}. Make sure the profiles table migration has been run.`;
  } else if (data) {
    form.elements.username.value = data.username || '';
    form.elements.phone.value = data.phone || '';
    form.elements.location.value = data.location || '';
    form.elements.avatar_url.value = data.avatar_url || '';
    setAvatarPreview(data.avatar_url);
  }
}

form.elements.avatar_url.addEventListener('input', () => setAvatarPreview(form.elements.avatar_url.value.trim()));

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!userId) return;
  const profile = {
    id: userId,
    username: form.elements.username.value.trim(),
    phone: form.elements.phone.value.trim(),
    location: form.elements.location.value.trim(),
    avatar_url: form.elements.avatar_url.value.trim() || null,
    updated_at: new Date().toISOString()
  };
  status.textContent = 'Saving your profile…';
  const { error } = await supabase.from('profiles').upsert(profile, { onConflict: 'id' });
  if (error) {
    console.error('Unable to save profile:', error);
    status.textContent = `Could not save your profile: ${error.message}. If the profiles table is missing, run supabase-schema.sql in Supabase SQL Editor.`;
    return;
  }
  status.textContent = 'Profile saved.';
  window.location.href = redirectUrl || '/';
});
