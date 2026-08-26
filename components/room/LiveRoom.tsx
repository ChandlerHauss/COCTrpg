"use client";

import type { Character, Room, RoomMember } from "@/lib/types";
import { useRoomRealtime } from "@/hooks/useRoomRealtime";
import { useCharacters } from "@/hooks/useCharacters";
import { useBackground } from "@/hooks/useBackground";
import RoomShell from "./RoomShell";

/** 真实房间：把 Realtime + 人物卡 hook 的结果接到纯展示的 RoomShell */
export default function LiveRoom({
  room,
  members,
  currentUserId,
  characters: initialCharacters,
  npcs: initialNpcs,
  activeCharacterId: initialActiveCharacterId,
}: {
  room: Room;
  members: RoomMember[];
  currentUserId: string;
  characters: Character[];
  npcs: Character[];
  activeCharacterId: string | null;
}) {
  const me = members.find((m) => m.userId === currentUserId);
  const role = me?.role ?? "pl";
  const isKp = role === "kp";

  const {
    characters,
    npcs,
    activeCharacterId,
    activeCharacter,
    saveCharacter,
    deleteCharacter,
    selectCharacter,
    uploadAvatar,
  } = useCharacters({
    roomId: room.id,
    userId: currentUserId,
    initialCharacters,
    initialNpcs,
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

  const {
    roomBg,
    personalBg,
    uploading: bgUploading,
    setRoomBgOpacity,
    setRoomBgBlur,
    uploadRoomBackground,
    clearRoomBackground,
    uploadPersonalBackground,
    clearPersonalBackground,
  } = useBackground({
    roomId: room.id,
    userId: currentUserId,
    initialRoomBg: {
      custom: room.bgCustom,
      opacity: room.bgOpacity,
      blur: room.bgBlur,
    },
    initialPersonalBg: me?.bgPersonal ?? null,
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
      npcs={npcs}
      activeCharacterId={activeCharacterId}
      onSelectCharacter={selectCharacter}
      saveCharacter={saveCharacter}
      deleteCharacter={deleteCharacter}
      uploadAvatar={uploadAvatar}
      roomBg={roomBg}
      personalBg={personalBg}
      bgUploading={bgUploading}
      onSetRoomBgOpacity={setRoomBgOpacity}
      onSetRoomBgBlur={setRoomBgBlur}
      onUploadRoomBg={uploadRoomBackground}
      onClearRoomBg={clearRoomBackground}
      onUploadPersonalBg={uploadPersonalBackground}
      onClearPersonalBg={clearPersonalBackground}
    />
  );
}
