-- Run in Supabase SQL Editor. Never put the service-role key in the browser.
create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  price numeric not null check (price >= 0),
  description text not null default '',
  category text not null,
  location text not null,
  images text[] not null default '{}',
  seller_id uuid not null references auth.users(id) on delete cascade,
  seller_whatsapp text not null default '',
  is_official boolean not null default false,
  is_featured boolean not null default false,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null default '',
  phone text not null default '',
  location text not null default '',
  avatar_url text,
  updated_at timestamptz not null default now()
);
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(product_id, buyer_id)
);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  text text not null check (length(text) between 1 and 5000),
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
-- Idempotently ensure guests can read the catalog. Row access and table privileges are both required.
drop policy if exists "Anyone can view products" on public.products;
create policy "Anyone can view products" on public.products for select to anon, authenticated using (true);
grant select on public.products to anon, authenticated;
create policy if not exists "Authenticated users create own listings" on public.products for insert to authenticated with check (seller_id = auth.uid() and is_official = false and is_featured = false and is_verified = false);
create policy if not exists "Sellers update own listings" on public.products for update to authenticated using (seller_id = auth.uid()) with check (seller_id = auth.uid());

-- A profile is private to its owner; the browser can only read/write the signed-in user's row.
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
grant select, insert, update on public.profiles to authenticated;

create policy if not exists "Participants can read conversations" on public.conversations for select to authenticated using (buyer_id = auth.uid() or seller_id = auth.uid());
create policy if not exists "Buyers can start conversations" on public.conversations for insert to authenticated with check (buyer_id = auth.uid() and seller_id <> auth.uid() and exists (select 1 from public.products p where p.id = product_id and p.seller_id = seller_id));
create policy if not exists "Participants can read messages" on public.messages for select to authenticated using (exists (select 1 from public.conversations c where c.id = conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())));
create policy if not exists "Participants can send messages" on public.messages for insert to authenticated with check (sender_id = auth.uid() and exists (select 1 from public.conversations c where c.id = conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())));

-- Product images must use a public bucket named product-images. Restrict uploads to each user's folder.
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true) on conflict (id) do nothing;
create policy if not exists "Public product image reads" on storage.objects for select using (bucket_id = 'product-images');
create policy if not exists "Users upload to own product image folder" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);
