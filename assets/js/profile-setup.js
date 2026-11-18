import { supabase } from './supabase.js';
import { NIGERIA_STATES } from './config.js';
const form = document.getElementById('profile-setup-form'), status = document.getElementById('profile-setup-status'), params = new URLSearchParams(location.search);
function safeNext(value) { try { const u = new URL(value || '/', location.origin); return u.origin === location.origin ? u.href : '/'; } catch { return '/'; } }
const locationSelect = form?.elements.location;
if (locationSelect) { locationSelect.innerHTML = '<option value="">Choose a state</option>' + NIGERIA_STATES.map(s => `<option value="${s}">${s}</option>`).join(''); }
const { data: { session }, error: authError } = await supabase.auth.getSession();
if (authError || !session) { status.textContent = authError ? `Unable to verify your sign-in: ${authError.message}` : ''; location.replace(`login.html?next=${encodeURIComponent(location.pathname + location.search)}`); }
else {
  const { data: existing, error } = await supabase.from('profiles').select('id').eq('id', session.user.id).maybeSingle();
  if (error) { console.error('Could not check profile status:', error); status.textContent = `Could not check your profile: ${error.message}`; }
  else if (existing) location.replace(safeNext(params.get('next')));
}
form?.addEventListener('submit', async event => {
  event.preventDefault(); const { data: { session: current }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !current) { status.textContent = sessionError ? `Could not verify sign-in: ${sessionError.message}` : 'Your session expired. Please log in again.'; return; }
  const button = form.querySelector('button[type="submit"]'); button.disabled = true; status.textContent = 'Saving profile…';
  try {
    let avatarUrl; const file = form.elements.avatar?.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) throw new Error('Choose an image smaller than 5 MB.');
      const path = `${current.user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert:true, contentType:file.type });
      if (uploadError) throw new Error(`Avatar upload failed. Create a public "avatars" storage bucket and add upload policies: ${uploadError.message}`);
      avatarUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
    }
    const profile = { id:current.user.id, display_name:form.elements.display_name.value.trim(), location:form.elements.location.value, whatsapp:form.elements.whatsapp.value.trim() };
    if (avatarUrl) profile.avatar_url = avatarUrl;
    if (!profile.display_name) throw new Error('Enter your display name.');
    let { error } = await supabase.from('profiles').upsert(profile, { onConflict:'id' });
    if (error && /avatar_url|column/i.test(error.message || '')) { delete profile.avatar_url; ({ error } = await supabase.from('profiles').upsert(profile, { onConflict:'id' })); }
    if (error) throw error; location.replace(safeNext(params.get('next')));
  } catch (error) { console.error('Could not save profile:', error); status.textContent = `Could not save your profile: ${error.message || 'Unexpected error. Please try again.'}`; button.disabled = false; }
});
