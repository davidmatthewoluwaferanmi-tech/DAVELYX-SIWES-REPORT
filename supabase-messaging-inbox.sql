-- DAVELYX messaging inbox compatibility migration. Run in Supabase SQL Editor.
-- This project stores participants on chats and links messages with chat_id;
-- chat_messages does not have buyer_id/seller_id columns.
alter table public.chat_messages add column if not exists is_read boolean not null default false;

alter table public.chat_messages enable row level security;
drop policy if exists "Chat participants read messages" on public.chat_messages;
create policy "Chat participants read messages" on public.chat_messages
  for select to authenticated
  using (exists (
    select 1 from public.chats c
    where c.id = chat_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  ));

drop policy if exists "Participants send chat messages" on public.chat_messages;
create policy "Participants send chat messages" on public.chat_messages
  for insert to authenticated
  with check (sender_id = auth.uid() and exists (
    select 1 from public.chats c
    where c.id = chat_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  ));

drop policy if exists "Participants mark incoming messages read" on public.chat_messages;
create policy "Participants mark incoming messages read" on public.chat_messages
  for update to authenticated
  using (sender_id <> auth.uid() and exists (
    select 1 from public.chats c
    where c.id = chat_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  ))
  with check (sender_id <> auth.uid() and is_read = true and exists (
    select 1 from public.chats c
    where c.id = chat_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  ));

grant select, insert on public.chat_messages to authenticated;
grant update (is_read) on public.chat_messages to authenticated;
