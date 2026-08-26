"use client";

import { useState } from "react";
import type { ConnectionStatus, Message, Room, RoomMember } from "@/lib/types";
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
}: {
  room: Room;
  members: RoomMember[];
  currentUserId: string;
  messages?: Message[];
  onSend?: (content: string) => void;
  onlineUserIds?: Set<string>;
  connectionStatus?: ConnectionStatus;
}) {
  const [bgMode, setBgMode] = useState<BgMode>("room");
  const [kpView, setKpView] = useState(false);

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
          currentCharacter={null}
        />
      </div>
    </div>
  );
}
