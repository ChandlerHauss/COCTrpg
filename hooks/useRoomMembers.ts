"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Role, RoomMember } from "@/lib/types";

type MemberRow = {
  room_id: string;
  user_id: string;
  role: Role;
  bg_personal: string | null;
};

/** 把服务端传入的静态成员列表升级为实时列表：订阅 room_members 的 INSERT/DELETE/UPDATE。 */
export function useRoomMembers({
  roomId,
  initialMembers,
}: {
  roomId: string;
  initialMembers: RoomMember[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [members, setMembers] = useState<RoomMember[]>(initialMembers);

  useEffect(() => {
    const channel = supabase
      .channel(`room-members:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_members",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const row = payload.new as MemberRow;
          // 成员表本身不含昵称/头像，二次查 profiles
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, username, avatar_url")
            .eq("id", row.user_id)
            .single();
          const member: RoomMember = {
            userId: row.user_id,
            role: row.role,
            avatarUrl: profile?.avatar_url ?? null,
            bgPersonal: row.bg_personal ?? null,
            bgPersonalOpacity: 1,
            bgPersonalBlur: 0,
            bgRoomOpacity: 0.15,
            bgRoomBlur: 0,
            user: {
              id: row.user_id,
              username: profile?.username ?? "未知",
              avatarUrl: profile?.avatar_url ?? null,
            },
            character: null,
          };
          setMembers((prev) =>
            prev.some((m) => m.userId === row.user_id) ? prev : [...prev, member]
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "room_members",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const old = payload.old as { user_id: string };
          setMembers((prev) => prev.filter((m) => m.userId !== old.user_id));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "room_members",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const row = payload.new as MemberRow;
          setMembers((prev) =>
            prev.map((m) =>
              m.userId === row.user_id
                ? { ...m, role: row.role, bgPersonal: row.bg_personal ?? null }
                : m
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, roomId]);

  return { members };
}
