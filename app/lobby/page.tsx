import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreateRoomDialog from "@/components/lobby/CreateRoomDialog";
import JoinRoomDialog from "@/components/lobby/JoinRoomDialog";
import SignOutButton from "@/components/lobby/SignOutButton";
import Avatar from "@/components/room/messages/Avatar";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  waiting: { label: "等待中", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-300" },
  running: { label: "进行中", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" },
  paused: { label: "暂停", cls: "bg-foreground/10 text-muted" },
  archived: { label: "已归档", cls: "bg-foreground/10 text-muted" },
};

type RoomRow = {
  id: string;
  code: string;
  name: string;
  max_players: number;
  status: string;
  host_id: string;
  created_at: string;
  room_members: { count: number }[];
};

export default async function LobbyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .single();

  const { data: rooms } = await supabase
    .from("rooms")
    .select(
      "id, code, name, max_players, status, host_id, created_at, room_members(count)"
    )
    .order("created_at", { ascending: false })
    .returns<RoomRow[]>();

  // 房主昵称（二次查询，避免依赖关系名）
  const hostIds = (rooms ?? []).map((r) => r.host_id);
  const { data: hosts } = hostIds.length
    ? await supabase.from("profiles").select("id, username").in("id", hostIds)
    : { data: [] };
  const hostMap = new Map((hosts ?? []).map((h) => [h.id, h.username]));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/settings" title="用户设置" aria-label="用户设置">
            <Avatar
              url={profile?.avatar_url ?? null}
              username={profile?.username ?? "调查员"}
              size="md"
            />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">跑团大厅</h1>
            <p className="mt-1 text-sm text-muted">你好，{profile?.username ?? "调查员"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CreateRoomDialog />
          <JoinRoomDialog />
          <SignOutButton />
        </div>
      </header>

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-muted">房间列表</h2>

        {rooms && rooms.length > 0 ? (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {rooms.map((r) => {
              const status = STATUS_META[r.status] ?? STATUS_META.waiting;
              const count = r.room_members?.[0]?.count ?? 0;
              return (
                <Link
                  key={r.id}
                  href={`/room/${r.id}`}
                  className="glass group rounded-3xl p-5 transition-all duration-300 ease-out hover:bg-surface-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="truncate font-medium text-foreground">{r.name}</h3>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${status.cls}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <span className="font-mono text-accent">#{r.code}</span>
                    <span>
                      {count} / {r.max_players} 人
                    </span>
                    <span>房主 {hostMap.get(r.host_id) ?? "—"}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="glass mt-3 rounded-3xl p-10 text-center text-sm text-muted">
            还没有房间，点击右上角「创建房间」开一局吧
          </div>
        )}
      </section>
    </main>
  );
}
