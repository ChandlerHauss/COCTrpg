"use client";

import type { CharacterCard, Room, RoomMember } from "@/lib/types";
import { useRoomRealtime } from "@/hooks/useRoomRealtime";
import { useCharacters } from "@/hooks/useCharacters";
import RoomShell from "./RoomShell";

/** 真实房间：把 Realtime + 人物卡 hook 的结果接到纯展示的 RoomShell */
export default function LiveRoom({
  room,
  members,
  currentUserId,
  characters: initialCharacters,
  activeCharacterId: initialActiveCharacterId,
}: {
  room: Room;
  members: RoomMember[];
  currentUserId: string;
  characters: CharacterCard[];
  activeCharacterId: string | null;
}) {
  const me = members.find((m) => m.userId === currentUserId);
  const role = me?.role ?? "pl";
  const isKp = role === "kp";

  const { characters, activeCharacterId, activeCharacter, createCharacter, selectCharacter } =
    useCharacters({
      roomId: room.id,
      userId: currentUserId,
      initialCharacters,
      initialActiveCharacterId,
    });

  const { messages, sendMessage, onlineUserIds, status } = useRoomRealtime({
    roomId: room.id,
    currentUser: {
      id: currentUserId,
      username: me?.user.username ?? "未知",
      avatarUrl: me?.user.avatarUrl ?? null,
    },
    currentRole: role,
    activeSkills: activeCharacter?.skills ?? [],
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
      isKp={isKp}
      characters={characters}
      activeCharacterId={activeCharacterId}
      onSelectCharacter={selectCharacter}
      onCreateCharacter={createCharacter}
    />
  );
}
