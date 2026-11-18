import { supabase, isSupabaseConfigured } from './supabase.js';
const form=document.getElementById('sell-form');const status=document.getElementById('sell-status');const payLink=document.getElementById('sellerPayBtn');
document.querySelectorAll('#featurePay,#verifyPay').forEach(box=>box.addEventListener('change',()=>{payLink.hidden=!(document.getElementById('featurePay').checked||document.getElementById('verifyPay').checked);}));
form.addEventListener('submit',async event=>{
 event.preventDefault();if(!isSupabaseConfigured){status.textContent='Set the Supabase project URL and anon key in assets/js/supabase.js first.';return;}
 const {data:{session},error:authError}=await supabase.auth.getSession();if(authError||!session){status.textContent='Please sign in to create a listing. Sign-in is available from the DAVELYX Chat listing flow; add an account sign-in page to register sellers.';return;}
 const data=new FormData(form);const files=[...data.getAll('photos')].filter(file=>file instanceof File&&file.size);if(files.length>5){status.textContent='Select no more than five photos.';return;}
 const title=String(data.get('title')||'').trim();const images=[];status.textContent='Uploading photos and publishing…';
 for(const file of files){const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');const path=`${session.user.id}/${crypto.randomUUID()}-${safeName}`;const {error}=await supabase.storage.from('product-images').upload(path,file,{upsert:false,contentType:file.type});if(error){status.textContent=`Photo upload failed: ${error.message}`;return;}const {data:publicUrl}=supabase.storage.from('product-images').getPublicUrl(path);images.push(publicUrl.publicUrl);}
 const {data:product,error}=await supabase.from('products').insert({title,price:Number(data.get('price')),description:String(data.get('description')||'').trim(),category:String(data.get('category')),location:String(data.get('location')).trim(),images,seller_id:session.user.id,seller_whatsapp:String(data.get('phone')||'').trim(),is_official:false,is_featured:false,is_verified:false}).select('id').single();
 if(error){status.textContent=`Could not publish listing: ${error.message}`;return;}
 status.textContent=`Listing published. View it here: ${location.origin}${location.pathname.replace(/sell\.html$/,'')}item.html?id=${encodeURIComponent(product.id)}. Selected promotion payments must be verified before badges are activated.`;form.reset();payLink.hidden=true;
});
