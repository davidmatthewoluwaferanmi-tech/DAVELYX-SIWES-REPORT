-- DAVELYX public launch additions. Run in Supabase SQL Editor after supabase-schema.sql.
alter table public.profiles add column if not exists display_name text not null default '';
alter table public.profiles add column if not exists whatsapp text not null default '';
alter table public.profiles add column if not exists created_at timestamptz not null default now();

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  last_message text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id,buyer_id),
  check (buyer_id <> seller_id)
);
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
alter table public.chats enable row level security;
alter table public.chat_messages enable row level security;
drop policy if exists "Chat participants read chats" on public.chats;
create policy "Chat participants read chats" on public.chats for select to authenticated using (buyer_id=auth.uid() or seller_id=auth.uid());
drop policy if exists "Buyers create chats" on public.chats;
create policy "Buyers create chats" on public.chats for insert to authenticated with check (buyer_id=auth.uid() and exists(select 1 from public.products p where p.id=product_id and p.seller_id=seller_id));
drop policy if exists "Chat participants update chats" on public.chats;
create policy "Chat participants update chats" on public.chats for update to authenticated using (buyer_id=auth.uid() or seller_id=auth.uid()) with check (buyer_id=auth.uid() or seller_id=auth.uid());
drop policy if exists "Chat participants read messages" on public.chat_messages;
create policy "Chat participants read messages" on public.chat_messages for select to authenticated using (exists(select 1 from public.chats c where c.id=chat_id and (c.buyer_id=auth.uid() or c.seller_id=auth.uid())));
drop policy if exists "Participants send chat messages" on public.chat_messages;
create policy "Participants send chat messages" on public.chat_messages for insert to authenticated with check (sender_id=auth.uid() and exists(select 1 from public.chats c where c.id=chat_id and (c.buyer_id=auth.uid() or c.seller_id=auth.uid())));
grant select,insert,update on public.chats to authenticated;
grant select,insert on public.chat_messages to authenticated;
