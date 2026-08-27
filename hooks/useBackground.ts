"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadImage, MAX_BG_BYTES } from "@/lib/storage";

export interface RoomBg {
  custom: string | null;
  opacity: number;
  blur: number;
}

export interface PersonalBg {
  url: string | null;
  opacity: number;
  blur: number;
}

/**
 * 背景视角（每人独立）：
 * - 房间背景图（custom）共享，仅 KP 上传/移除（rooms.bg_custom）。
 * - 房间背景透明度/模糊度（opacity/blur）每人独立，存 room_members.bg_room_*。
 * - 个人背景（url/opacity/blur）每人独立，存 room_members.bg_personal / bg_personal_*。
 * 客户端直连 Supabase：rooms 由 RLS 限定 host_id 可改，room_members 仅本人可改。
 * 改动写入即持久化，其他玩家下次进房可见（本期不做 Realtime 推送）。
 */
export function useBackground({
  roomId,
  userId,
  initialRoomBg,
  initialPersonalBg,
}: {
  roomId: string;
  userId: string;
  initialRoomBg: RoomBg;
  initialPersonalBg: PersonalBg;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [roomBg, setRoomBg] = useState<RoomBg>(initialRoomBg);
  const [personalBg, setPersonalBg] = useState<PersonalBg>(initialPersonalBg);
  const [uploading, setUploading] = useState<null | "room" | "personal">(null);

  const roomOpacityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roomBlurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const personalOpacityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const personalBlurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (roomOpacityTimer.current) clearTimeout(roomOpacityTimer.current);
      if (roomBlurTimer.current) clearTimeout(roomBlurTimer.current);
      if (personalOpacityTimer.current) clearTimeout(personalOpacityTimer.current);
      if (personalBlurTimer.current) clearTimeout(personalBlurTimer.current);
    },
    []
  );

  // 共享房间背景图（仅 KP）
  const persistRoom = useCallback(
    (bg_custom: string | null) => {
      supabase
        .from("rooms")
        .update({ bg_custom })
        .eq("id", roomId)
        .then(({ error }) => {
          if (error) console.error("房间背景保存失败", error.message);
        });
    },
    [supabase, roomId]
  );

  // 本人视角字段（房间背景透明度/模糊度 + 个人背景图/透明度/模糊度）
  const persistPersonal = useCallback(
    (patch: {
      bg_personal?: string | null;
      bg_personal_opacity?: number;
      bg_personal_blur?: number;
      bg_room_opacity?: number;
      bg_room_blur?: number;
    }) => {
      supabase
        .from("room_members")
        .update(patch)
        .eq("room_id", roomId)
        .eq("user_id", userId)
        .then(({ error }) => {
          if (error) console.error("个人背景保存失败", error.message);
        });
    },
    [supabase, roomId, userId]
  );

  const setRoomBgOpacity = useCallback(
    (opacity: number) => {
      setRoomBg((prev) => ({ ...prev, opacity }));
      if (roomOpacityTimer.current) clearTimeout(roomOpacityTimer.current);
      roomOpacityTimer.current = setTimeout(
        () => persistPersonal({ bg_room_opacity: opacity }),
        300
      );
    },
    [persistPersonal]
  );

  const setRoomBgBlur = useCallback(
    (blur: number) => {
      setRoomBg((prev) => ({ ...prev, blur }));
      if (roomBlurTimer.current) clearTimeout(roomBlurTimer.current);
      roomBlurTimer.current = setTimeout(
        () => persistPersonal({ bg_room_blur: blur }),
        300
      );
    },
    [persistPersonal]
  );

  const setPersonalBgOpacity = useCallback(
    (opacity: number) => {
      setPersonalBg((prev) => ({ ...prev, opacity }));
      if (personalOpacityTimer.current) clearTimeout(personalOpacityTimer.current);
      personalOpacityTimer.current = setTimeout(
        () => persistPersonal({ bg_personal_opacity: opacity }),
        300
      );
    },
    [persistPersonal]
  );

  const setPersonalBgBlur = useCallback(
    (blur: number) => {
      setPersonalBg((prev) => ({ ...prev, blur }));
      if (personalBlurTimer.current) clearTimeout(personalBlurTimer.current);
      personalBlurTimer.current = setTimeout(
        () => persistPersonal({ bg_personal_blur: blur }),
        300
      );
    },
    [persistPersonal]
  );

  /** 上传房间背景（共享，仅 KP），返回 null=成功、string=错误信息 */
  const uploadRoomBackground = useCallback(
    async (file: File): Promise<string | null> => {
      setUploading("room");
      const url = await uploadImage(supabase, {
        bucket: "backgrounds",
        folder: userId,
        file,
        maxBytes: MAX_BG_BYTES,
      });
      setUploading(null);
      if (!url) return "上传失败，请检查图片类型与大小（≤5MB）";
      setRoomBg((prev) => ({ ...prev, custom: url }));
      persistRoom(url);
      return null;
    },
    [supabase, userId, persistRoom]
  );

  const clearRoomBackground = useCallback(() => {
    setRoomBg((prev) => ({ ...prev, custom: null }));
    persistRoom(null);
  }, [persistRoom]);

  /** 上传个人背景（仅本人可见），返回 null=成功、string=错误信息 */
  const uploadPersonalBackground = useCallback(
    async (file: File): Promise<string | null> => {
      setUploading("personal");
      const url = await uploadImage(supabase, {
        bucket: "backgrounds",
        folder: userId,
        file,
        maxBytes: MAX_BG_BYTES,
      });
      setUploading(null);
      if (!url) return "上传失败，请检查图片类型与大小（≤5MB）";
      setPersonalBg((prev) => ({ ...prev, url }));
      persistPersonal({ bg_personal: url });
      return null;
    },
    [supabase, userId, persistPersonal]
  );

  const clearPersonalBackground = useCallback(() => {
    setPersonalBg((prev) => ({ ...prev, url: null }));
    persistPersonal({ bg_personal: null });
  }, [persistPersonal]);

  return {
    roomBg,
    personalBg,
    uploading,
    setRoomBgOpacity,
    setRoomBgBlur,
    setPersonalBgOpacity,
    setPersonalBgBlur,
    uploadRoomBackground,
    clearRoomBackground,
    uploadPersonalBackground,
    clearPersonalBackground,
  };
}
