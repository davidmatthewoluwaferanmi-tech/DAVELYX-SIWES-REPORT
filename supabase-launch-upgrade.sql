-- DAVELYX launch safety additions. Apply after supabase-launch-schema.sql.
-- Additive/idempotent so existing deployments are not disrupted.
alter table public.profiles add column if not exists avatar_url text;
alter table public.products add column if not exists views_count bigint not null default 0;
alter table public.chats add column if not exists updated_at timestamptz not null default now();

-- Authenticated marketplace users may view public seller display information, including buyers/sellers in chats.
alter table public.profiles enable row level security;
drop policy if exists "Profiles visible to authenticated marketplace members" on public.profiles;
create policy "Profiles visible to authenticated marketplace members" on public.profiles for select to authenticated using (true);

-- Set up the public avatar bucket and per-user upload permissions from the Supabase dashboard
-- or uncomment the statements below if your deployment role permits storage administration.
-- insert into storage.buckets(id,name,public) values ('avatars','avatars',true) on conflict(id) do update set public=true;
-- create policy "Users upload own avatars" on storage.objects for insert to authenticated with check (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
-- create policy "Users update own avatars" on storage.objects for update to authenticated using (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
-- create policy "Public read avatars" on storage.objects for select to public using (bucket_id='avatars');
