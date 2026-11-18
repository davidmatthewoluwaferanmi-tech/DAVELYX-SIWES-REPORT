import { supabase } from './supabase.js';
const form = document.getElementById('sell-form');
const status = document.getElementById('sell-status');
const payLink = document.getElementById('sellerPayBtn');
const modal = document.getElementById('seller-auth-modal');
const authForm = document.getElementById('seller-auth-form');
const authStatus = document.getElementById('seller-auth-status');
const emailInput = document.getElementById('seller-identity');
const otpInput = document.getElementById('seller-otp');
let isPublishing = false;

emailInput.type = 'email'; emailInput.autocomplete = 'email'; emailInput.required = true;
const emailLabel = emailInput.closest('label'); if (emailLabel) emailLabel.firstChild.textContent = 'Email address ';
const passwordInput = document.getElementById('seller-password');
if (passwordInput) { const label = passwordInput.closest('label'); if (label) label.hidden = true; passwordInput.required = false; }
const authSubmit = authForm.querySelector('button[type="submit"]'); if (authSubmit) authSubmit.textContent = 'Send verification code';
document.querySelectorAll('#featurePay,#verifyPay').forEach(box => box.addEventListener('change', () => {
  payLink.hidden = !(document.getElementById('featurePay').checked || document.getElementById('verifyPay').checked);
}));
function openAuthModal() { modal.hidden = false; modal.style.display = 'grid'; emailInput.focus(); }
function closeAuthModal() { modal.hidden = true; modal.style.display = 'none'; }
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
    const verifiedUser = await currentUser();
    if (!verifiedUser || verifiedUser.id !== user.id) throw new Error('Your sign-in expired. Please request a new code.');
    const { data: product, error } = await supabase.from('products').insert({
      title: String(data.get('title') || '').trim(), price: Number(data.get('price')),
      description: String(data.get('description') || '').trim(), category: String(data.get('category')),
      location: String(data.get('location') || '').trim(), images, seller_id: verifiedUser.id,
      seller_whatsapp: String(data.get('phone') || '').trim(), is_official: false, is_featured: false, is_verified: false
    }).select('id').single();
    if (error) throw error;
    status.textContent = `Listing published. View it here: ${location.origin}${location.pathname.replace(/sell\\.html$/, '')}item.html?id=${encodeURIComponent(product.id)}. Selected promotion payments must be verified before badges are activated.`;
    form.reset(); payLink.hidden = true;
  } catch (error) {
    status.textContent = `Could not publish listing: ${error.message}`;
  } finally { isPublishing = false; }
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  try {
    const user = await currentUser();
    if (!user) { status.textContent = 'Check email for a 6-digit code to sign in and publish your listing.'; openAuthModal(); return; }
    await publishListing(user);
  } catch (error) { status.textContent = `Authentication check failed: ${error.message}`; }
});
authForm.addEventListener('submit', async event => {
  event.preventDefault();
  const email = emailInput.value.trim();
  if (!email) { authStatus.textContent = 'Enter a valid email address.'; return; }
  authStatus.textContent = 'Sending verification code…';
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: 'https://davidmatthewoluwaferanmi-tech.github.io/DAVELYX-SIWES-REPORT/',
      shouldCreateUser: true
    }
  });
  if (error) { authStatus.textContent = error.message; return; }
  document.getElementById('seller-otp-area').hidden = false;
  authStatus.textContent = 'Check email for 6-digit code.';
});
document.getElementById('verify-seller-otp').addEventListener('click', async () => {
  const email = emailInput.value.trim(); const token = otpInput.value.trim();
  if (!email || !token) { authStatus.textContent = 'Enter your email address and 6-digit code.'; return; }
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) { authStatus.textContent = error.message; return; }
  const user = data.user || await currentUser();
  if (!user) { authStatus.textContent = 'Code verified but no signed-in user was returned. Request a new code and try again.'; return; }
  closeAuthModal();
  await publishListing(user);
});
document.getElementById('cancel-seller-auth').addEventListener('click', closeAuthModal);
