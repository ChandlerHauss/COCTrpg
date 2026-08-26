"use client";

import type { Room, RoomMember } from "@/lib/types";
import { useRoomRealtime } from "@/hooks/useRoomRealtime";
import RoomShell from "./RoomShell";

/** 真实房间：把 Realtime hook 的结果接到纯展示的 RoomShell */
export default function LiveRoom({
  room,
  members,
  currentUserId,
}: {
  room: Room;
  members: RoomMember[];
  currentUserId: string;
}) {
  const me = members.find((m) => m.userId === currentUserId);
  const { messages, sendMessage, onlineUserIds, status } = useRoomRealtime({
    roomId: room.id,
    currentUser: {
      id: currentUserId,
      username: me?.user.username ?? "未知",
      avatarUrl: me?.user.avatarUrl ?? null,
    },
    currentRole: me?.role ?? "pl",
  });

  return (
    <RoomShell
      room={room}
      members={members}
      currentUserId={currentUserId}
      messages={messages}
      onSend={sendMessage}
      onlineUserIds={onlineUserIds}
      connectionStatus={status}
    />
  );
}
