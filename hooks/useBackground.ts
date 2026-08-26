"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadImage, MAX_BG_BYTES } from "@/lib/storage";

export interface RoomBg {
  custom: string | null;
  opacity: number;
  blur: number;
}

/**
 * 房间背景（KP 上传 + 透明度/模糊度）+ 个人背景（PL 本人可见）。
 * 客户端直连 Supabase：rooms 由 RLS 限定仅 host_id 可改，room_members 仅本人可改。
 * 背景改动写入即持久化，其他玩家下次进房可见（本期不做 Realtime 推送）。
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
  initialPersonalBg: string | null;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [roomBg, setRoomBg] = useState<RoomBg>(initialRoomBg);
  const [personalBg, setPersonalBg] = useState<string | null>(initialPersonalBg);
  const [uploading, setUploading] = useState<null | "room" | "personal">(null);

  const opacityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (opacityTimer.current) clearTimeout(opacityTimer.current);
      if (blurTimer.current) clearTimeout(blurTimer.current);
    },
    []
  );

  const persistRoom = useCallback(
    (patch: { bg_custom?: string | null; bg_opacity?: number; bg_blur?: number }) => {
      supabase
        .from("rooms")
        .update(patch)
        .eq("id", roomId)
        .then(({ error }) => {
          if (error) console.error("房间背景保存失败", error.message);
        });
    },
    [supabase, roomId]
  );

  const setRoomBgOpacity = useCallback(
    (opacity: number) => {
      setRoomBg((prev) => ({ ...prev, opacity }));
      if (opacityTimer.current) clearTimeout(opacityTimer.current);
      opacityTimer.current = setTimeout(() => persistRoom({ bg_opacity: opacity }), 300);
    },
    [persistRoom]
  );

  const setRoomBgBlur = useCallback(
    (blur: number) => {
      setRoomBg((prev) => ({ ...prev, blur }));
      if (blurTimer.current) clearTimeout(blurTimer.current);
      blurTimer.current = setTimeout(() => persistRoom({ bg_blur: blur }), 300);
    },
    [persistRoom]
  );

  /** 上传房间背景，返回 null=成功、string=错误信息 */
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
      persistRoom({ bg_custom: url });
      return null;
    },
    [supabase, userId, persistRoom]
  );

  const clearRoomBackground = useCallback(() => {
    setRoomBg((prev) => ({ ...prev, custom: null }));
    persistRoom({ bg_custom: null });
  }, [persistRoom]);

  const persistPersonal = useCallback(
    (url: string | null) => {
      supabase
        .from("room_members")
        .update({ bg_personal: url })
        .eq("room_id", roomId)
        .eq("user_id", userId)
        .then(({ error }) => {
          if (error) console.error("个人背景保存失败", error.message);
        });
    },
    [supabase, roomId, userId]
  );

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
      setPersonalBg(url);
      persistPersonal(url);
      return null;
    },
    [supabase, userId, persistPersonal]
  );

  const clearPersonalBackground = useCallback(() => {
    setPersonalBg(null);
    persistPersonal(null);
  }, [persistPersonal]);

  return {
    roomBg,
    personalBg,
    uploading,
    setRoomBgOpacity,
    setRoomBgBlur,
    uploadRoomBackground,
    clearRoomBackground,
    uploadPersonalBackground,
    clearPersonalBackground,
  };
}
