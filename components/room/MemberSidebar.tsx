"use client";

import { useState } from "react";
import type { Room, RoomMember } from "@/lib/types";
import { resolveAvatarUrl } from "@/lib/avatar";
import Avatar from "./messages/Avatar";

const ROLE_LABEL: Record<string, { text: string; cls: string }> = {
  kp: { text: "KP", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-300" },
  pl: { text: "PL", cls: "bg-sky-500/15 text-sky-600 dark:text-sky-300" },
  spectator: { text: "观战", cls: "bg-foreground/10 text-muted" },
};

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  waiting: { text: "等待中", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-300" },
  running: { text: "进行中", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" },
  paused: { text: "暂停", cls: "bg-foreground/10 text-muted" },
  archived: { text: "已归档", cls: "bg-foreground/10 text-muted" },
};

export default function MemberSidebar({
  room,
  members,
  currentUserId,
  onlineUserIds,
}: {
  room: Room;
  members: RoomMember[];
  currentUserId: string;
  onlineUserIds?: Set<string>;
}) {
  const [tab, setTab] = useState<"members" | "characters">("members");
  const status = STATUS_LABEL[room.status] ?? STATUS_LABEL.running;

  return (
    <aside className="glass flex h-full flex-col overflow-hidden rounded-3xl">
      {/* 房间信息 */}
      <div className="border-b border-border p-4">
        <h2 className="truncate text-sm font-semibold text-foreground">{room.name}</h2>
        <div className="mt-1.5 flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] ${status.cls}`}>{status.text}</span>
          <span className="font-mono text-[10px] text-muted">#{room.code}</span>
          <span className="text-[10px] text-muted">
            {members.length} 人 · 上限 {room.maxPlayers}
          </span>
        </div>
      </div>

      {/* Tab 切换（玻璃分段控件） */}
      <div className="border-b border-border p-2">
        <div className="flex rounded-xl bg-foreground/5 p-0.5 text-xs">
          {(["members", "characters"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-[10px] py-1.5 font-medium transition-all duration-300 ease-out ${
                tab === t
                  ? "bg-surface-strong text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t === "members" ? "成员" : "人物卡"}
            </button>
          ))}
        </div>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto p-2">
        {tab === "members" ? (
          members.length > 0 ? (
            members.map((m) => {
              const url = resolveAvatarUrl(m);
              const isMe = m.userId === currentUserId;
              const role = ROLE_LABEL[m.role];
              const online = onlineUserIds?.has(m.userId) ?? false;
              return (
                <div
                  key={m.userId}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors duration-300 hover:bg-foreground/5"
                >
                  <Avatar url={url} username={m.user.username} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        title={online ? "在线" : "离线"}
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          online ? "bg-emerald-400" : "bg-foreground/25"
                        }`}
                      />
                      <span className="truncate text-sm text-foreground">{m.user.username}</span>
                      {isMe && <span className="text-[10px] text-accent">你</span>}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className={`rounded px-1 py-px text-[10px] ${role.cls}`}>{role.text}</span>
                      <span
                        className={`text-[10px] ${
                          online ? "text-emerald-600 dark:text-emerald-300" : "text-muted"
                        }`}
                      >
                        {online ? "在线" : "离线"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-xs text-muted">暂无成员</div>
          )
        ) : (
          <div className="p-6 text-center text-xs text-muted">人物卡将在 Phase 3 支持</div>
        )}
      </div>
    </aside>
  );
}
