// Configure these with your Supabase project URL and public anon key before deployment.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
export const isSupabaseConfigured = SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes('YOUR_') && !SUPABASE_ANON_KEY.includes('YOUR_');
// A valid inert URL avoids the SDK throwing before the user has added project credentials.
export const supabase = createClient(isSupabaseConfigured ? SUPABASE_URL : 'https://placeholder.supabase.co', isSupabaseConfigured ? SUPABASE_ANON_KEY : 'placeholder-anon-key');

// Schema reference (see supabase-schema.sql for executable DDL and RLS policies):
// products: id, title, price, description, category, location, images text[], seller_id,
// seller_whatsapp, is_official bool, is_featured bool, is_verified bool, created_at
// conversations: id, product_id, buyer_id, seller_id, created_at
// messages: id, conversation_id, sender_id, text, created_at
// RLS: public can read products; authenticated sellers can insert their own products;
// authenticated conversation participants can read/create conversations and messages.
