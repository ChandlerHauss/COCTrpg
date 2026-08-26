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
