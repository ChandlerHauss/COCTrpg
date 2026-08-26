"use client";

import { useState } from "react";
import type {
  CharacterCard,
  ConnectionStatus,
  Message,
  Room,
  RoomMember,
  Skill,
} from "@/lib/types";
import MemberSidebar from "./MemberSidebar";
import ChatLog from "./ChatLog";
import DicePanel from "./DicePanel";
import type { BgMode } from "./Background";

export default function RoomShell({
  room,
  members,
  currentUserId,
  messages = [],
  onSend,
  onlineUserIds,
  connectionStatus,
  isKp = false,
  characters = [],
  activeCharacterId = null,
  onSelectCharacter,
  onCreateCharacter,
}: {
  room: Room;
  members: RoomMember[];
  currentUserId: string;
  messages?: Message[];
  onSend?: (content: string) => Promise<string | null>;
  onlineUserIds?: Set<string>;
  connectionStatus?: ConnectionStatus;
  isKp?: boolean;
  characters?: CharacterCard[];
  activeCharacterId?: string | null;
  onSelectCharacter?: (id: string) => Promise<void>;
  onCreateCharacter?: (name: string, skills: Skill[]) => Promise<string | null>;
}) {
  const [bgMode, setBgMode] = useState<BgMode>("room");
  // KP 默认开「KP 视角」看到暗骰；PL 恒为 PL 视角
  const [kpView, setKpView] = useState(isKp);

  return (
    <div className="h-dvh w-full overflow-x-auto text-foreground">
      <div className="grid h-full min-w-[960px] grid-cols-[240px_minmax(0,1fr)_280px] gap-3 p-3">
        <MemberSidebar
          room={room}
          members={members}
          currentUserId={currentUserId}
          onlineUserIds={onlineUserIds}
        />
        <ChatLog
          roomName={room.name}
          roomStatus={room.status}
          messages={messages}
          revealHidden={kpView}
          bgMode={bgMode}
          bgOpacity={room.bgOpacity}
          onSend={onSend}
          connectionStatus={connectionStatus}
        />
        <DicePanel
          bgMode={bgMode}
          setBgMode={setBgMode}
          kpView={kpView}
          setKpView={setKpView}
          isKp={isKp}
          characters={characters}
          activeCharacterId={activeCharacterId}
          onSelectCharacter={onSelectCharacter}
          onCreateCharacter={onCreateCharacter}
          onSend={onSend}
        />
      </div>
    </div>
  );
}
