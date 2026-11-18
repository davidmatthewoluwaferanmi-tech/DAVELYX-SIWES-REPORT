import { supabase } from './supabase.js';
const form = document.getElementById('sell-form');
const status = document.getElementById('sell-status');
const payLink = document.getElementById('sellerPayBtn');
const modal = document.getElementById('seller-auth-modal');
const authForm = document.getElementById('seller-auth-form');
const authStatus = document.getElementById('seller-auth-status');
const emailInput = document.getElementById('seller-identity');
const passwordInput = document.getElementById('seller-password');
const { data: { session } } = await supabase.auth.getSession();
if (!session) location.replace(`login.html?next=${encodeURIComponent('/sell.html')}`);
else {
  const { data: profile } = await supabase.from('profiles').select('id').eq('id', session.user.id).maybeSingle();
  if (!profile) location.replace('profile-setup.html?next=%2Fsell.html');
}
let isPublishing = false;
document.getElementById('seller-otp-area')?.remove();
if (emailInput) { emailInput.type='email'; emailInput.autocomplete='email'; emailInput.required=true; const label=emailInput.closest('label'); if(label) label.firstChild.textContent='Email address '; }
if (passwordInput) { passwordInput.type='password'; passwordInput.autocomplete='current-password'; passwordInput.required=true; const label=passwordInput.closest('label'); if(label) label.hidden=false; }
const authSubmit=authForm.querySelector('button[type="submit"]'); if(authSubmit) authSubmit.textContent='Log in to publish';
document.querySelectorAll('#featurePay,#verifyPay').forEach(box=>box.addEventListener('change',()=>{payLink.hidden=!(document.getElementById('featurePay').checked||document.getElementById('verifyPay').checked);}));
function openAuthModal(){modal.hidden=false;modal.style.display='grid';emailInput.focus();} function closeAuthModal(){modal.hidden=true;modal.style.display='none';}
async function currentUser(){const {data:{session},error}=await supabase.auth.getSession();if(error)throw error;return session?.user||null;}
async function publishListing(user){if(isPublishing)return;isPublishing=true;try{const data=new FormData(form);const files=[...data.getAll('photos')].filter(file=>file instanceof File&&file.size);if(files.length>5){status.textContent='Select no more than five photos.';return;}status.textContent='Uploading photos and publishing…';const images=[];for(const file of files){const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');const path=`${user.id}/${crypto.randomUUID()}-${safeName}`;const {error:uploadError}=await supabase.storage.from('product-images').upload(path,file,{upsert:false,contentType:file.type});if(uploadError)throw new Error(`Photo upload failed: ${uploadError.message}`);images.push(supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl);}const verifiedUser=await currentUser();if(!verifiedUser||verifiedUser.id!==user.id)throw new Error('Your sign-in expired. Please log in again.');const {data:product,error}=await supabase.from('products').insert({title:String(data.get('title')||'').trim(),price:Number(data.get('price')),description:String(data.get('description')||'').trim(),category:String(data.get('category')),location:String(data.get('location')||'').trim(),images,seller_id:verifiedUser.id,seller_whatsapp:String(data.get('phone')||'').trim(),is_official:false,is_featured:false,is_verified:false}).select('id').single();if(error)throw error;location.href=`/item.html?id=${encodeURIComponent(product.id)}`;}catch(error){status.textContent=`Could not publish listing: ${error.message}`;}finally{isPublishing=false;}}
form.addEventListener('submit',async event=>{event.preventDefault();try{const user=await currentUser();if(!user){status.textContent='Log in to publish your listing.';location.href=`login.html?next=${encodeURIComponent('/sell.html')}`;return;}await publishListing(user);}catch(error){status.textContent=`Authentication check failed: ${error.message}`;}});
authForm.addEventListener('submit',async event=>{event.preventDefault();const email=emailInput.value.trim(),password=passwordInput.value;if(!email||!password){authStatus.textContent='Enter your email address and password.';return;}authStatus.textContent='Signing in…';const {data,error}=await supabase.auth.signInWithPassword({email,password});if(error){authStatus.textContent=error.message;return;}if(!data.session){authStatus.textContent='Sign-in did not create an authenticated session.';return;}closeAuthModal();await publishListing(data.session.user);});
document.getElementById('cancel-seller-auth').addEventListener('click',closeAuthModal);
