"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ConnectionStatus, Message, Role, Skill, SpeakAs } from "@/lib/types";
import { findSkillValue, judgeRoll, parseDiceCommand, rollD100 } from "@/lib/dice";

type MessageRow = {
  id: string;
  type: Message["type"];
  content: string;
  sender_id: string | null;
  sender_name: string;
  sender_role: Message["senderRole"] | null;
  sender_avatar: string | null;
  created_at: string;
  roll_label: string | null;
  roll_result: number | null;
  roll_target: number | null;
  roll_level: Message["rollLevel"] | null;
  is_hidden: boolean | null;
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
    senderId: row.sender_id ?? null,
    content: row.content,
    timestamp: formatClock(row.created_at),
    rollLabel: row.roll_label ?? undefined,
    rollResult: row.roll_result ?? undefined,
    rollTarget: row.roll_target ?? undefined,
    rollLevel: row.roll_level ?? undefined,
    isHidden: row.is_hidden ?? undefined,
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
  activeSkills,
}: {
  roomId: string;
  currentUser: { id: string; username: string; avatarUrl: string | null };
  currentRole: Role;
  activeSkills: Skill[];
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

  /**
   * 发送一条输入：自动识别骰子指令（/r /rh）与普通聊天。
   * 返回 null 表示成功；返回 string 表示错误信息（由输入框内联展示）。
   */
  const sendMessage = useCallback(
    async (content: string, as?: SpeakAs): Promise<string | null> => {
      const trimmed = content.trim();
      if (!trimmed) return null;

      // 身份：as 提供时以所选身份显示（姓名/头像/角色）；sender_id 恒为本人（RLS 必需）
      const base = {
        room_id: roomId,
        sender_id: currentUser.id,
        sender_name: as?.name ?? currentUser.username,
        sender_role: as?.role ?? currentRole,
        sender_avatar: as?.avatarUrl ?? currentUser.avatarUrl,
      };
      const skills = as?.skills ?? activeSkills;

      const parsed = parseDiceCommand(trimmed);

      let payload: Record<string, unknown>;
      if (parsed === null) {
        // 普通聊天
        payload = { ...base, type: as?.type ?? "chat", content: trimmed };
      } else if (parsed.kind === "raw") {
        // /r 1d100：纯点数，无目标无判定
        payload = {
          ...base,
          type: "dice",
          content: "",
          roll_label: "1d100",
          roll_result: rollD100(),
          is_hidden: parsed.hidden,
        };
      } else if (parsed.kind === "target") {
        // /r 50：固定目标检定
        const result = rollD100();
        payload = {
          ...base,
          type: "dice",
          content: "",
          roll_label: "检定",
          roll_result: result,
          roll_target: parsed.target,
          roll_level: judgeRoll(result, parsed.target),
          is_hidden: parsed.hidden,
        };
      } else {
        // /r 侦查：从当前身份技能表取值（人物卡/NPC 用其技能，自己用活跃角色）
        const value = findSkillValue(skills, parsed.skillName);
        if (value === null) {
          return skills.length === 0
            ? "请先在右侧「我的角色」创建并选择角色"
            : `角色没有技能「${parsed.skillName}」`;
        }
        const result = rollD100();
        payload = {
          ...base,
          type: "dice",
          content: "",
          roll_label: parsed.skillName,
          roll_result: result,
          roll_target: value,
          roll_level: judgeRoll(result, value),
          is_hidden: parsed.hidden,
        };
      }

      const { error } = await supabase.from("messages").insert(payload);
      if (error) {
        console.error("发送消息失败", error.message);
        return "发送失败，请重试";
      }
      return null;
    },
    [
      supabase,
      roomId,
      currentUser.id,
      currentUser.username,
      currentUser.avatarUrl,
      currentRole,
      activeSkills,
    ]
  );

  return { messages, sendMessage, onlineUserIds, status };
}
