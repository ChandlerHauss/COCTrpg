"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ConnectionStatus, Message, Role } from "@/lib/types";

type MessageRow = {
  id: string;
  type: Message["type"];
  content: string;
  sender_name: string;
  sender_role: Message["senderRole"] | null;
  sender_avatar: string | null;
  created_at: string;
};

/** created_at(ISO) → 本地 HH:MM */
function formatClock(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function rowToMessage(row: MessageRow): Message {
  return {
    id: row.id,
    type: row.type,
    senderName: row.sender_name,
    senderRole: row.sender_role ?? undefined,
    senderAvatar: row.sender_avatar,
    content: row.content,
    timestamp: formatClock(row.created_at),
  };
}

/** 按 id 去重后追加，避免重连拉取历史与实时 INSERT 竞态产生重复 */
function dedupeAppend(list: Message[], next: Message): Message[] {
  if (list.some((m) => m.id === next.id)) return list;
  return [...list, next];
}

export function useRoomRealtime({
  roomId,
  currentUser,
  currentRole,
}: {
  roomId: string;
  currentUser: { id: string; username: string; avatarUrl: string | null };
  currentRole: Role;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<ConnectionStatus>("connecting");

  useEffect(() => {
    let cancelled = false;

    async function reloadHistory() {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (cancelled) return;
      if (error) {
        console.error("加载历史消息失败", error.message);
        return;
      }
      const rows = (data ?? []) as MessageRow[];
      // 取最近 100 条（倒序取回后反转为正序）
      setMessages(rows.slice().reverse().map(rowToMessage));
    }

    const channel = supabase.channel(`room:${roomId}`, {
      config: { presence: { key: currentUser.id } },
    });

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const row = payload.new as MessageRow;
          setMessages((prev) => dedupeAppend(prev, rowToMessage(row)));
        }
      )
      .on("presence", { event: "sync" }, () => {
        setOnlineUserIds(new Set(Object.keys(channel.presenceState())));
      })
      .subscribe(async (s) => {
        if (cancelled) return;
        if (s === "SUBSCRIBED") {
          // 初次订阅 + 每次自动重连后都会走到这里：拉历史 + 重新上报 presence
          setStatus("connected");
          try {
            await reloadHistory();
            await channel.track({
              user_id: currentUser.id,
              username: currentUser.username,
              role: currentRole,
            });
          } catch (e) {
            console.error("实时订阅初始化失败", e);
          }
        } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT" || s === "CLOSED") {
          setStatus("disconnected");
        }
      });

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase, roomId, currentUser.id, currentUser.username, currentRole]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      const { error } = await supabase.from("messages").insert({
        room_id: roomId,
        sender_id: currentUser.id,
        type: "chat",
        content: trimmed,
        sender_name: currentUser.username,
        sender_role: currentRole,
        sender_avatar: currentUser.avatarUrl,
      });
      if (error) console.error("发送消息失败", error.message);
    },
    [
      supabase,
      roomId,
      currentUser.id,
      currentUser.username,
      currentUser.avatarUrl,
      currentRole,
    ]
  );

  return { messages, sendMessage, onlineUserIds, status };
}
