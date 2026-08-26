"use client";

import { useCallback, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CharacterCard, Skill } from "@/lib/types";

/**
 * 最小人物卡管理：列出我的角色、创建角色、选择本房活跃角色。
 * 服务端页面负责首次取数（initialCharacters / initialActiveCharacterId），
 * 之后的创建 / 切换在客户端直连 Supabase（RLS 保证 owner 身份）。
 */
export function useCharacters({
  roomId,
  userId,
  initialCharacters,
  initialActiveCharacterId,
}: {
  roomId: string;
  userId: string;
  initialCharacters: CharacterCard[];
  initialActiveCharacterId: string | null;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [characters, setCharacters] = useState<CharacterCard[]>(initialCharacters);
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(
    initialActiveCharacterId
  );

  const activeCharacter =
    characters.find((c) => c.id === activeCharacterId) ?? null;

  /** 创建角色并设为活跃。返回 null=成功，string=错误信息 */
  const createCharacter = useCallback(
    async (name: string, skills: Skill[]): Promise<string | null> => {
      const { data, error } = await supabase
        .from("characters")
        .insert({ owner_id: userId, name, skills })
        .select("id, name, skills")
        .single();
      if (error || !data) {
        console.error("创建角色失败", error?.message);
        return "创建角色失败，请重试";
      }

      const card: CharacterCard = {
        id: data.id,
        name: data.name,
        skills: Array.isArray(data.skills) ? (data.skills as Skill[]) : [],
      };
      setCharacters((prev) => [...prev, card]);

      // 创建后立即设为本房活跃角色
      const { error: updateError } = await supabase
        .from("room_members")
        .update({ active_character_id: card.id })
        .eq("room_id", roomId)
        .eq("user_id", userId);
      if (updateError) {
        console.error("设置活跃角色失败", updateError.message);
      } else {
        setActiveCharacterId(card.id);
      }
      return null;
    },
    [supabase, userId, roomId]
  );

  /** 切换本房活跃角色 */
  const selectCharacter = useCallback(
    async (id: string) => {
      setActiveCharacterId(id);
      const { error } = await supabase
        .from("room_members")
        .update({ active_character_id: id })
        .eq("room_id", roomId)
        .eq("user_id", userId);
      if (error) console.error("切换活跃角色失败", error.message);
    },
    [supabase, roomId, userId]
  );

  return {
    characters,
    activeCharacterId,
    activeCharacter,
    createCharacter,
    selectCharacter,
  };
}
