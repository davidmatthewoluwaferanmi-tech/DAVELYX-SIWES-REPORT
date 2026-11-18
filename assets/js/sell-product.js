import { supabase } from './supabase.js';
const form = document.getElementById('sell-form');
const status = document.getElementById('sell-status');
const payLink = document.getElementById('sellerPayBtn');
const modal = document.getElementById('seller-auth-modal');
const authForm = document.getElementById('seller-auth-form');
const authStatus = document.getElementById('seller-auth-status');
let authIdentity = '';
let authMethod = 'email';
let isPublishing = false;

document.querySelectorAll('#featurePay,#verifyPay').forEach(box => box.addEventListener('change', () => {
  payLink.hidden = !(document.getElementById('featurePay').checked || document.getElementById('verifyPay').checked);
}));
function openAuthModal() { modal.hidden = false; modal.style.display = 'grid'; document.getElementById('seller-identity').focus(); }
function closeAuthModal() { modal.hidden = true; modal.style.display = 'none'; }
function identityOptions(identity, password) {
  const isPhone = /^\+?[\d\s()-]{8,}$/.test(identity);
  return isPhone ? { phone: identity, password } : { email: identity, password };
}
async function currentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error && error.name !== 'AuthSessionMissingError') throw error;
  return data?.user || null;
}
async function publishListing(user) {
  if (isPublishing) return;
  isPublishing = true;
  try {
    const data = new FormData(form);
    const files = [...data.getAll('photos')].filter(file => file instanceof File && file.size);
    if (files.length > 5) { status.textContent = 'Select no more than five photos.'; return; }
    status.textContent = 'Uploading photos and publishing…';
    const images = [];
    for (const file of files) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file, { upsert: false, contentType: file.type });
      if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);
      images.push(supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl);
    }
    // Re-check the verified auth user immediately before writing the seller-owned product.
    const verifiedUser = await currentUser();
    if (!verifiedUser || verifiedUser.id !== user.id) throw new Error('Your sign-in expired. Please sign in again.');
    const { data: product, error } = await supabase.from('products').insert({
      title: String(data.get('title') || '').trim(), price: Number(data.get('price')),
      description: String(data.get('description') || '').trim(), category: String(data.get('category')),
      location: String(data.get('location') || '').trim(), images, seller_id: verifiedUser.id,
      seller_whatsapp: String(data.get('phone') || '').trim(), is_official: false, is_featured: false, is_verified: false
    }).select('id').single();
    if (error) throw error;
    status.textContent = `Listing published. View it here: ${location.origin}${location.pathname.replace(/sell\.html$/, '')}item.html?id=${encodeURIComponent(product.id)}. Selected promotion payments must be verified before badges are activated.`;
    form.reset(); payLink.hidden = true;
  } catch (error) {
    status.textContent = `Could not publish listing: ${error.message}`;
  } finally { isPublishing = false; }
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  try {
    const user = await currentUser();
    if (!user) { status.textContent = 'Create an account or sign in to publish your listing.'; openAuthModal(); return; }
    await publishListing(user);
  } catch (error) { status.textContent = `Authentication check failed: ${error.message}`; }
});
authForm.addEventListener('submit', async event => {
  event.preventDefault();
  authIdentity = document.getElementById('seller-identity').value.trim();
  const password = document.getElementById('seller-password').value;
  authMethod = /^\+?[\d\s()-]{8,}$/.test(authIdentity) ? 'phone' : 'email';
  authStatus.textContent = 'Creating account…';
  let result = await supabase.auth.signUp(identityOptions(authIdentity, password));
  if (result.error && /already registered|already been registered/i.test(result.error.message)) {
    result = await supabase.auth.signInWithPassword(identityOptions(authIdentity, password));
  }
  if (result.error) { authStatus.textContent = result.error.message; return; }
  if (result.data.session) {
    const user = result.data.user || result.data.session.user;
    closeAuthModal(); await publishListing(user); return;
  }
  document.getElementById('seller-otp-area').hidden = false;
  authStatus.textContent = `A verification code was sent. Enter it below to finish sign-in.${result.data.user ? '' : ' If an account already exists, use its password.'}`;
});
document.getElementById('verify-seller-otp').addEventListener('click', async () => {
  const token = document.getElementById('seller-otp').value.trim();
  if (!token) { authStatus.textContent = 'Enter the verification code.'; return; }
  const credentials = authMethod === 'phone' ? { phone: authIdentity, token, type: 'sms' } : { email: authIdentity, token, type: 'signup' };
  const { data, error } = await supabase.auth.verifyOtp(credentials);
  if (error) { authStatus.textContent = error.message; return; }
  closeAuthModal();
  const user = data.user || await currentUser();
  if (!user) { openAuthModal(); authStatus.textContent = 'Verification succeeded, but no signed-in user was returned. Sign in and try again.'; return; }
  await publishListing(user);
});
document.getElementById('cancel-seller-auth').addEventListener('click', closeAuthModal);
