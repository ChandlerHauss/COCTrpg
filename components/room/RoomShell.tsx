"use client";

import { useState } from "react";
import type {
  Character,
  CharacterInput,
  ConnectionStatus,
  Message,
  Room,
  RoomMember,
} from "@/lib/types";
import MemberSidebar from "./MemberSidebar";
import ChatLog from "./ChatLog";
import DicePanel from "./DicePanel";
import CharacterEditorDialog from "./CharacterEditorDialog";
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
  npcs = [],
  activeCharacterId = null,
  onSelectCharacter,
  saveCharacter,
  deleteCharacter,
  uploadAvatar,
}: {
  room: Room;
  members: RoomMember[];
  currentUserId: string;
  messages?: Message[];
  onSend?: (content: string) => Promise<string | null>;
  onlineUserIds?: Set<string>;
  connectionStatus?: ConnectionStatus;
  isKp?: boolean;
  characters?: Character[];
  npcs?: Character[];
  activeCharacterId?: string | null;
  onSelectCharacter?: (id: string) => Promise<void>;
  saveCharacter?: (input: CharacterInput, id?: string) => Promise<string | null>;
  deleteCharacter?: (id: string) => Promise<void>;
  uploadAvatar?: (file: File) => Promise<string | null>;
}) {
  const [bgMode, setBgMode] = useState<BgMode>("room");
  // KP 默认开「KP 视角」看到暗骰；PL 恒为 PL 视角
  const [kpView, setKpView] = useState(isKp);
  // 人物卡编辑器（null=关闭；character=null 表示新建）
  const [editor, setEditor] = useState<{
    character: Character | null;
    mode: "pc" | "npc";
  } | null>(null);

  const openEditor = (character: Character | null, mode: "pc" | "npc") =>
    setEditor({ character, mode });

  return (
    <div className="h-dvh w-full overflow-x-auto text-foreground">
      <div className="grid h-full min-w-[960px] grid-cols-[240px_minmax(0,1fr)_280px] gap-3 p-3">
        <MemberSidebar
          room={room}
          members={members}
          currentUserId={currentUserId}
          onlineUserIds={onlineUserIds}
          isKp={isKp}
          npcs={npcs}
          characters={characters}
          onEdit={openEditor}
          onDelete={(id) => deleteCharacter?.(id)}
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
          onNewCharacter={() => openEditor(null, "pc")}
          onSend={onSend}
        />
      </div>

      {editor && saveCharacter && uploadAvatar && (
        <CharacterEditorDialog
          character={editor.character}
          mode={editor.mode}
          isKp={isKp}
          userId={currentUserId}
          onClose={() => setEditor(null)}
          onSave={saveCharacter}
          uploadAvatar={uploadAvatar}
        />
      )}
    </div>
  );
}
