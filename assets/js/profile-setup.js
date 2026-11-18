import { supabase } from './supabase.js';
const form = document.getElementById('profile-setup-form');
const status = document.getElementById('profile-setup-status');
const params = new URLSearchParams(location.search);
function safeNext(value) { try { const u = new URL(value || '/', location.origin); return u.origin === location.origin ? u.href : '/'; } catch { return '/'; } }
const { data: { session }, error: authError } = await supabase.auth.getSession();
if (authError || !session) location.replace(`login.html?next=${encodeURIComponent(location.pathname + location.search)}`);
else {
  const { data: existing, error } = await supabase.from('profiles').select('id').eq('id', session.user.id).maybeSingle();
  if (!error && existing) location.replace(safeNext(params.get('next')));
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  const { data: { session: current } } = await supabase.auth.getSession();
  if (!current) { status.textContent = 'Your session expired. Please log in again.'; return; }
  const button = form.querySelector('button[type="submit"]'); button.disabled = true; status.textContent = 'Saving profile…';
  try {
    let avatarUrl = null;
    const file = form.elements.avatar.files[0];
    if (file) {
      if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) throw new Error('Choose an image smaller than 5 MB.');
      const path = `${current.user.id}/avatars/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file, { upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;
      avatarUrl = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
    }
    const { error } = await supabase.from('profiles').upsert({ id: current.user.id, display_name: form.elements.display_name.value.trim(), location: form.elements.location.value, whatsapp: form.elements.whatsapp.value.trim(), avatar_url: avatarUrl, created_at: new Date().toISOString() }, { onConflict: 'id' });
    if (error) throw error;
    location.replace(safeNext(params.get('next')));
  } catch (error) { status.textContent = `Could not save your profile: ${error.message}`; button.disabled = false; }
});
