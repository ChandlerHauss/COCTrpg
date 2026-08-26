import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LiveRoom from "@/components/room/LiveRoom";
import JoinRoomDialog from "@/components/lobby/JoinRoomDialog";
import type { CharacterCard, Room, RoomMember, Skill } from "@/lib/types";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: roomRow } = await supabase
    .from("rooms")
    .select("id, code, name, status, max_players, host_id, bg_custom, bg_opacity")
    .eq("id", id)
    .maybeSingle();
  if (!roomRow) notFound();

  // 非成员 → 展示加入提示（预填房间号，密码在加入弹层输入）
  const { data: myMembership } = await supabase
    .from("room_members")
    .select("role, active_character_id")
    .eq("room_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!myMembership) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="glass-strong w-full max-w-sm rounded-3xl p-8 text-center">
          <h1 className="truncate text-xl font-semibold text-foreground">{roomRow.name}</h1>
          <p className="mt-1 text-sm text-muted">
            房间号 <span className="font-mono text-accent">#{roomRow.code}</span>
          </p>
          <div className="mt-6">
            <JoinRoomDialog defaultCode={roomRow.code} />
          </div>
        </div>
      </main>
    );
  }

  // 拉成员 + 资料（二次查询，避免依赖关系名）
  const { data: memberRows } = await supabase
    .from("room_members")
    .select("role, user_id")
    .eq("room_id", id)
    .order("joined_at", { ascending: true });

  const userIds = (memberRows ?? []).map((m) => m.user_id);
  const { data: profiles } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const members: RoomMember[] = (memberRows ?? []).map((m) => {
    const p = profileMap.get(m.user_id);
    return {
      userId: m.user_id,
      role: m.role,
      avatarUrl: p?.avatar_url ?? null,
      bgPersonal: null,
      user: {
        id: m.user_id,
        username: p?.username ?? "未知",
        avatarUrl: p?.avatar_url ?? null,
      },
      character: null,
    };
  });

  const room: Room = {
    id: roomRow.id,
    code: roomRow.code,
    name: roomRow.name,
    status: roomRow.status,
    maxPlayers: roomRow.max_players,
    hostId: roomRow.host_id,
    bgCustom: roomRow.bg_custom,
    bgOpacity: Number(roomRow.bg_opacity),
  };

  // 我的最小人物卡（骰子系统所需）+ 本房活跃角色
  const { data: characterRows } = await supabase
    .from("characters")
    .select("id, name, skills")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  const characters: CharacterCard[] = (characterRows ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    skills: Array.isArray(c.skills) ? (c.skills as Skill[]) : [],
  }));

  const activeCharacterId = myMembership.active_character_id ?? null;

  return (
    <LiveRoom
      room={room}
      members={members}
      currentUserId={user.id}
      characters={characters}
      activeCharacterId={activeCharacterId}
    />
  );
}
