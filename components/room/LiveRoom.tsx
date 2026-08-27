"use client";

import type { Character, Role, Room, RoomMember, SpeakAsOption } from "@/lib/types";
import { useRoomRealtime } from "@/hooks/useRoomRealtime";
import { useCharacters } from "@/hooks/useCharacters";
import { useBackground } from "@/hooks/useBackground";
import { useRoomMembers } from "@/hooks/useRoomMembers";
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
  const isKp = room.hostId === currentUserId; // 谁创建谁就是 KP
  const role: Role = isKp ? "kp" : (me?.role ?? "pl");

  // 实时成员列表：退出/加入时左侧成员栏即时刷新（me 仍用静态 members 推导，保持稳定）
  const { members: liveMembers } = useRoomMembers({
    roomId: room.id,
    initialMembers: members,
  });

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
    setPersonalBgOpacity,
    setPersonalBgBlur,
    uploadRoomBackground,
    clearRoomBackground,
    uploadPersonalBackground,
    clearPersonalBackground,
  } = useBackground({
    roomId: room.id,
    userId: currentUserId,
    initialRoomBg: {
      custom: room.bgCustom,
      opacity: me?.bgRoomOpacity ?? 0.15,
      blur: me?.bgRoomBlur ?? 0,
    },
    initialPersonalBg: {
      url: me?.bgPersonal ?? null,
      opacity: me?.bgPersonalOpacity ?? 1,
      blur: me?.bgPersonalBlur ?? 0,
    },
  });

  // 身份选择器：自己 + 我的人物卡 +（仅 KP）房间 NPC
  const speakAsOptions: SpeakAsOption[] = [
    {
      key: "self",
      as: {
        name: me?.user.username ?? "未知",
        avatarUrl: me?.user.avatarUrl ?? null,
        role,
        type: "chat",
      },
    },
    ...characters.map(
      (c): SpeakAsOption => ({
        key: `pc-${c.id}`,
        characterId: c.id,
        as: { name: c.name, avatarUrl: c.avatarUrl, role, type: "chat", skills: c.skills },
      })
    ),
    ...(isKp
      ? npcs.map(
          (c): SpeakAsOption => ({
            key: `npc-${c.id}`,
            as: { name: c.name, avatarUrl: c.avatarUrl, role: "npc", type: "npc", skills: c.skills },
          })
        )
      : []),
  ];

  return (
    <RoomShell
      room={room}
      members={liveMembers}
      currentUserId={currentUserId}
      showRoomActions
      messages={messages}
      onSend={sendMessage}
      speakAsOptions={speakAsOptions}
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
      onSetPersonalBgOpacity={setPersonalBgOpacity}
      onSetPersonalBgBlur={setPersonalBgBlur}
      onUploadRoomBg={uploadRoomBackground}
      onClearRoomBg={clearRoomBackground}
      onUploadPersonalBg={uploadPersonalBackground}
      onClearPersonalBg={clearPersonalBackground}
    />
  );
}
