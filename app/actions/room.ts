"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hashPassword, verifyPassword } from "@/lib/password";
import { generateRoomCode } from "@/lib/room-code";

export type RoomActionState = { error?: string };

/** 创建房间：房名 + 密码（可选）+ 最大人数；房主以 KP 身份入房 */
export async function createRoom(
  prevState: RoomActionState,
  formData: FormData
): Promise<RoomActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const maxPlayers = Number(formData.get("maxPlayers") ?? 5);

  if (!name) return { error: "请填写房间名" };
  if (!Number.isInteger(maxPlayers) || maxPlayers < 2 || maxPlayers > 20) {
    return { error: "最大人数需在 2–20 之间" };
  }

  const passwordHash = password ? hashPassword(password) : null;

  // 生成唯一房间号（撞唯一约束 23505 时重试）
  let roomId: string | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRoomCode();
    const { data, error } = await supabase
      .from("rooms")
      .insert({
        code,
        name,
        password_hash: passwordHash,
        max_players: maxPlayers,
        host_id: user.id,
      })
      .select("id")
      .single();
    if (!error) {
      roomId = data.id;
      break;
    }
    if (error.code === "23505") continue;
    return { error: error.message };
  }
  if (!roomId) return { error: "房间号生成失败，请重试" };

  const { error: memberError } = await supabase
    .from("room_members")
    .insert({ room_id: roomId, user_id: user.id, role: "kp" });
  if (memberError) return { error: memberError.message };

  revalidatePath("/lobby");
  redirect(`/room/${roomId}`);
}

/** 加入房间：房间号 + 密码（可选） */
export async function joinRoom(
  prevState: RoomActionState,
  formData: FormData
): Promise<RoomActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const password = String(formData.get("password") ?? "");

  if (!code) return { error: "请输入房间号" };

  const { data: room } = await supabase
    .from("rooms")
    .select("id, password_hash, max_players")
    .eq("code", code)
    .maybeSingle();

  if (!room) return { error: "房间不存在，请核对房间号" };

  if (room.password_hash && !verifyPassword(password, room.password_hash)) {
    return { error: "房间密码错误" };
  }

  // 已在房间 → 直接进入
  const { data: existing } = await supabase
    .from("room_members")
    .select("id")
    .eq("room_id", room.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) redirect(`/room/${room.id}`);

  // 容量检查
  const { count } = await supabase
    .from("room_members")
    .select("*", { count: "exact", head: true })
    .eq("room_id", room.id);
  if (count !== null && count >= room.max_players) {
    return { error: "房间已满" };
  }

  const { error } = await supabase
    .from("room_members")
    .insert({ room_id: room.id, user_id: user.id, role: "pl" });
  if (error) return { error: error.message };

  revalidatePath("/lobby");
  redirect(`/room/${room.id}`);
}

/** 退出房间 */
export async function leaveRoom(roomId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("room_members")
    .delete()
    .eq("room_id", roomId)
    .eq("user_id", user.id);

  revalidatePath("/lobby");
  redirect("/lobby");
}
