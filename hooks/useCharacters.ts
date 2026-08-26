"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { characterInputToRow, rowToCharacter, type CharacterRow } from "@/lib/character";
import type { Character, CharacterInput } from "@/lib/types";

/** 按 id 去重 upsert（INSERT 时避免与实时事件重复） */
function upsertById(list: Character[], c: Character): Character[] {
  const i = list.findIndex((x) => x.id === c.id);
  if (i === -1) return [...list, c];
  const next = list.slice();
  next[i] = c;
  return next;
}

/**
 * 完整人物卡管理：我的 PC + 房间 NPC，实时同步，CRUD + 头像上传。
 * 服务端页面负责首屏取数（initialCharacters=我的 PC / initialNpcs=房间 NPC），
 * 之后的读写客户端直连 Supabase（RLS 保证 owner 身份），Realtime 订阅同步其他端变更。
 */
export function useCharacters({
  roomId,
  userId,
  initialCharacters,
  initialNpcs,
  initialActiveCharacterId,
}: {
  roomId: string;
  userId: string;
  initialCharacters: Character[];
  initialNpcs: Character[];
  initialActiveCharacterId: string | null;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [characters, setCharacters] = useState<Character[]>(initialCharacters);
  const [npcs, setNpcs] = useState<Character[]>(initialNpcs);
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(
    initialActiveCharacterId
  );

  const activeCharacter =
    characters.find((c) => c.id === activeCharacterId) ?? null;

  // 实时：订阅我的 PC（owner）与房间 NPC（room_id）变更
  useEffect(() => {
    const handleChange = (payload: RealtimePostgresChangesPayload<CharacterRow>) => {
      if (payload.eventType === "DELETE") {
        const id = payload.old?.id;
        if (id) {
          setCharacters((prev) => prev.filter((c) => c.id !== id));
          setNpcs((prev) => prev.filter((c) => c.id !== id));
        }
        return;
      }
      const c = rowToCharacter(payload.new as CharacterRow);
      if (c.isNpc) setNpcs((prev) => upsertById(prev, c));
      else setCharacters((prev) => upsertById(prev, c));
    };

    const channel = supabase
      .channel(`characters:${roomId}:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "characters", filter: `owner_id=eq.${userId}` },
        handleChange
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "characters", filter: `room_id=eq.${roomId}` },
        handleChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, roomId, userId]);

  /** 本地 upsert（按 isNpc 路由到对应列表） */
  const applyLocal = useCallback((c: Character) => {
    if (c.isNpc) setNpcs((prev) => upsertById(prev, c));
    else setCharacters((prev) => upsertById(prev, c));
  }, []);

  /** 设置本房活跃角色 */
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

  /** 创建 / 更新人物卡（PC 或 NPC）。返回 null=成功，string=错误信息 */
  const saveCharacter = useCallback(
    async (input: CharacterInput, id?: string): Promise<string | null> => {
      const row = characterInputToRow(input, roomId);

      if (id) {
        const { error } = await supabase
          .from("characters")
          .update(row)
          .eq("id", id);
        if (error) {
          console.error("更新角色失败", error.message);
          return "保存失败，请重试";
        }
        applyLocal({ ...input, id, ownerId: userId });
        return null;
      }

      const { data, error } = await supabase
        .from("characters")
        .insert({ ...row, owner_id: userId })
        .select("*")
        .single();
      if (error || !data) {
        console.error("创建角色失败", error?.message);
        return "创建角色失败，请重试";
      }
      const c = rowToCharacter(data as CharacterRow);
      applyLocal(c);

      // 新建 PC 自动设为本房活跃角色（NPC 不参与活跃选择）
      if (!c.isNpc) {
        await selectCharacter(c.id);
      }
      return null;
    },
    [supabase, userId, roomId, applyLocal, selectCharacter]
  );

  /** 删除人物卡；若删除的是活跃角色则清空活跃 */
  const deleteCharacter = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("characters").delete().eq("id", id);
      if (error) {
        console.error("删除角色失败", error.message);
        return;
      }
      setCharacters((prev) => prev.filter((c) => c.id !== id));
      setNpcs((prev) => prev.filter((c) => c.id !== id));
      if (activeCharacterId === id) {
        setActiveCharacterId(null);
        await supabase
          .from("room_members")
          .update({ active_character_id: null })
          .eq("room_id", roomId)
          .eq("user_id", userId);
      }
    },
    [supabase, roomId, userId, activeCharacterId]
  );

  /** 上传头像到 Storage（公开桶 avatars，按 user_id 目录）。返回 publicUrl，失败返回 null */
  const uploadAvatar = useCallback(
    async (file: File): Promise<string | null> => {
      if (!file.type.startsWith("image/")) return null;
      if (file.size > 2 * 1024 * 1024) return null;
      const ext = file.name.split(".").pop() || "png";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: false });
      if (error) {
        console.error("头像上传失败", error.message);
        return null;
      }
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      return data.publicUrl;
    },
    [supabase, userId]
  );

  return {
    characters,
    npcs,
    activeCharacterId,
    activeCharacter,
    saveCharacter,
    deleteCharacter,
    selectCharacter,
    uploadAvatar,
  };
}
