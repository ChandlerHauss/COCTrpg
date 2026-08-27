-- =====================================================================
-- Phase 2 建表语句（在 Supabase Dashboard → SQL Editor 中整体执行）
-- =====================================================================

-- 1. profiles：用户资料（1:1 关联 auth.users）
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null unique,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- 2. rooms：房间（大厅列表 + 加入目标）
create table if not exists public.rooms (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,           -- 6 位房间号
  name          text not null,
  password_hash text,                           -- null = 无密码（scrypt 加盐哈希）
  max_players   int  not null default 5 check (max_players between 2 and 20),
  host_id       uuid not null references public.profiles(id) on delete cascade,
  status        text not null default 'waiting'
                check (status in ('waiting','running','paused','archived')),
  bg_custom     text,
  bg_opacity    numeric not null default 0.15,
  created_at    timestamptz not null default now()
);

-- 3. room_members：房间成员
create table if not exists public.room_members (
  id        uuid primary key default gen_random_uuid(),
  room_id   uuid not null references public.rooms(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  role      text not null default 'pl' check (role in ('kp','pl','spectator')),
  joined_at timestamptz not null default now(),
  unique (room_id, user_id)
);
create index if not exists room_members_room_idx on public.room_members(room_id);
create index if not exists room_members_user_idx on public.room_members(user_id);

-- 4. 触发器：注册后自动建 profile
--    昵称取自 signUp 的 raw_user_meta_data.username，缺省用邮箱前缀
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'username', ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute procedure public.handle_new_user();

-- 5. RLS
alter table public.profiles     enable row level security;
alter table public.rooms        enable row level security;
alter table public.room_members enable row level security;

create policy "profiles_select_all" on public.profiles
  for select using (true);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "rooms_select_all" on public.rooms
  for select using (true);
create policy "rooms_insert_own" on public.rooms
  for insert with check (auth.uid() = host_id);
create policy "rooms_update_host" on public.rooms
  for update using (auth.uid() = host_id);
create policy "rooms_delete_host" on public.rooms
  for delete using (auth.uid() = host_id);

create policy "room_members_select_all" on public.room_members
  for select using (true);
create policy "room_members_insert_own" on public.room_members
  for insert with check (auth.uid() = user_id);
create policy "room_members_delete_own" on public.room_members
  for delete using (auth.uid() = user_id);

-- 6. messages：实时聊天消息（Phase 3）
create table if not exists public.messages (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid not null references public.rooms(id) on delete cascade,
  sender_id     uuid references public.profiles(id) on delete set null, -- system 消息可为 null
  type          text not null default 'chat'
                check (type in ('chat','narrate','dice','system','ooc','npc')),
  content       text not null,
  sender_name   text not null default '',
  sender_role   text,
  sender_avatar text,
  created_at    timestamptz not null default now()
);
create index if not exists messages_room_created_idx on public.messages(room_id, created_at desc);

alter table public.messages enable row level security;

create policy "messages_select_member" on public.messages
  for select using (
    exists (select 1 from public.room_members rm
            where rm.room_id = messages.room_id and rm.user_id = auth.uid())
  );

create policy "messages_insert_member" on public.messages
  for insert with check (
    sender_id = auth.uid() and
    exists (select 1 from public.room_members rm
            where rm.room_id = messages.room_id and rm.user_id = auth.uid())
  );

-- 7. 开启实时订阅（postgres_changes 必需；等价于 Dashboard → Database → Replication 勾选 messages）
alter publication supabase_realtime add table public.messages;

-- 8. 通知 PostgREST 刷新 schema cache（避免 "Could not find the table" 间歇报错）
notify pgrst, 'reload schema';

-- =====================================================================
-- Phase 4 骰子系统（增量 DDL，老项目单独执行；新项目随上面整段一起跑）
-- =====================================================================

-- 9. characters：最小人物卡（角色名 + 技能 jsonb）
create table if not exists public.characters (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles(id) on delete cascade,
  name       text not null,
  skills     jsonb not null default '[]',   -- [{name, value, isBase}]
  created_at timestamptz not null default now()
);
create index if not exists characters_owner_idx on public.characters(owner_id);

alter table public.characters enable row level security;

create policy "characters_select_all" on public.characters for select using (true);
create policy "characters_insert_own" on public.characters for insert with check (auth.uid() = owner_id);
create policy "characters_update_own" on public.characters for update using (auth.uid() = owner_id);
create policy "characters_delete_own" on public.characters for delete using (auth.uid() = owner_id);

-- 10. room_members 增加「本房活跃角色」+ 补更新策略（此前无 update 策略）
alter table public.room_members
  add column if not exists active_character_id uuid references public.characters(id) on delete set null;

create policy "room_members_update_own" on public.room_members
  for update using (auth.uid() = user_id);

-- 11. messages 增加骰子列（匹配 Message 类型的 dice 字段）
alter table public.messages
  add column if not exists roll_label  text,
  add column if not exists roll_result int,
  add column if not exists roll_target int,
  add column if not exists roll_level  text,
  add column if not exists is_hidden    boolean not null default false;

notify pgrst, 'reload schema';

-- =====================================================================
-- Phase 5 完整人物卡（COC 7 字段 + NPC + 头像 Storage）
-- =====================================================================

-- 12. characters 扩充完整 COC 7 字段 + NPC
alter table public.characters
  add column if not exists occupation  text,
  add column if not exists age         int,
  add column if not exists str         int,
  add column if not exists con         int,
  add column if not exists siz         int,
  add column if not exists dex         int,
  add column if not exists app         int,
  add column if not exists int         int,
  add column if not exists pow         int,
  add column if not exists edu         int,
  add column if not exists hp          int,
  add column if not exists hp_max      int,
  add column if not exists san         int,
  add column if not exists san_max     int,
  add column if not exists mp          int,
  add column if not exists mp_max      int,
  add column if not exists status      text not null default 'normal'
             check (status in ('normal','temp_insane','indefinite_insane','perm_insane')),
  add column if not exists is_npc      boolean not null default false,
  add column if not exists is_hidden   boolean not null default false,
  add column if not exists avatar_url  text,
  add column if not exists room_id     uuid references public.rooms(id) on delete cascade;

create index if not exists characters_room_idx on public.characters(room_id)
  where room_id is not null;

-- 13. 头像存储桶：公开读、按 user_id 目录写
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_update_own" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_delete_own" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 16. 背景图存储桶（房间背景 + 个人背景）：公开读、按 user_id 目录写
insert into storage.buckets (id, name, public)
  values ('backgrounds', 'backgrounds', true)
  on conflict (id) do nothing;

create policy "backgrounds_public_read" on storage.objects
  for select using (bucket_id = 'backgrounds');

create policy "backgrounds_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'backgrounds'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "backgrounds_update_own" on storage.objects
  for update using (
    bucket_id = 'backgrounds'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "backgrounds_delete_own" on storage.objects
  for delete using (
    bucket_id = 'backgrounds'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 17. rooms 增加背景模糊度；room_members 增加个人背景 URL
alter table public.rooms
  add column if not exists bg_blur numeric not null default 0;

alter table public.room_members
  add column if not exists bg_personal text;

notify pgrst, 'reload schema';

-- =====================================================================
-- Phase 7 房间成员实时列表（退出/加入实时刷新左侧成员栏，增量段只跑一次）
-- =====================================================================

-- 18. 开启 room_members 实时订阅（postgres_changes 必需；等价于 Dashboard → Database → Replication 勾选 room_members）
alter publication supabase_realtime add table public.room_members;

notify pgrst, 'reload schema';

-- =====================================================================
-- Phase 8 每人独立背景视角（房间/个人背景各自透明度与模糊度，增量段只跑一次）
-- =====================================================================

-- 19. room_members 增加本人视角背景字段（房间背景透明度/模糊度 + 个人背景透明度/模糊度）
alter table public.room_members
  add column if not exists bg_room_opacity     numeric not null default 0.15;
alter table public.room_members
  add column if not exists bg_room_blur        numeric not null default 0;
alter table public.room_members
  add column if not exists bg_personal_opacity numeric not null default 1;
alter table public.room_members
  add column if not exists bg_personal_blur    numeric not null default 0;

notify pgrst, 'reload schema';
