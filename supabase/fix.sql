-- =====================================================================
-- 补丁脚本：补齐 schema.sql Phase 5 漏跑的 13 / 16 / 17 段
-- 在 Supabase Dashboard → SQL Editor 中整体执行（幂等，可重复执行）
--
-- 缺失内容（已验证）：
--   * public.rooms       缺 bg_blur 列   → 房间页 select bg_blur 报错 → notFound() → 404
--   * public.room_members 缺 bg_personal 列
--   * Storage 桶 avatars / backgrounds 不存在 → 上传头像/背景 404 Bucket not found
--   * characters 未加入 supabase_realtime 发布 → 角色卡实时同步失效
-- =====================================================================

-- 17) 房间背景模糊度 + 成员个人背景 URL（缺了它们才导致房间 404）
alter table public.rooms
  add column if not exists bg_blur numeric not null default 0;

alter table public.room_members
  add column if not exists bg_personal text;

-- 13) avatars 头像桶：公开读、按 user_id 目录写
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 16) backgrounds 背景桶：公开读、按 user_id 目录写
insert into storage.buckets (id, name, public)
  values ('backgrounds', 'backgrounds', true)
  on conflict (id) do nothing;

drop policy if exists "backgrounds_public_read" on storage.objects;
create policy "backgrounds_public_read" on storage.objects
  for select using (bucket_id = 'backgrounds');

drop policy if exists "backgrounds_insert_own" on storage.objects;
create policy "backgrounds_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'backgrounds'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "backgrounds_update_own" on storage.objects;
create policy "backgrounds_update_own" on storage.objects
  for update using (
    bucket_id = 'backgrounds'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "backgrounds_delete_own" on storage.objects;
create policy "backgrounds_delete_own" on storage.objects
  for delete using (
    bucket_id = 'backgrounds'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- characters 加入实时发布（schema.sql 遗漏；角色卡变更实时同步需要）
do $$
begin
  alter publication supabase_realtime add table public.characters;
exception when duplicate_object then null;
end $$;

-- 通知 PostgREST 刷新 schema cache
notify pgrst, 'reload schema';
