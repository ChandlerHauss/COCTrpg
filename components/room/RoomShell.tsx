"use client";

import { useEffect, useState } from "react";
import type {
  Character,
  CharacterInput,
  ConnectionStatus,
  Message,
  Room,
  RoomMember,
  SpeakAs,
  SpeakAsOption,
} from "@/lib/types";
import type { PersonalBg, RoomBg } from "@/hooks/useBackground";
import MemberSidebar from "./MemberSidebar";
import ChatLog from "./ChatLog";
import DicePanel from "./DicePanel";
import RoomSettingsPanel from "./RoomSettingsPanel";
import CharacterEditorDialog from "./CharacterEditorDialog";
import type { BgMode } from "./Background";

export default function RoomShell({
  room,
  members,
  currentUserId,
  messages = [],
  onSend,
  speakAsOptions = [],
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
  roomBg,
  personalBg,
  bgUploading,
  onSetRoomBgOpacity,
  onSetRoomBgBlur,
  onSetPersonalBgOpacity,
  onSetPersonalBgBlur,
  onUploadRoomBg,
  onClearRoomBg,
  onUploadPersonalBg,
  onClearPersonalBg,
  showRoomActions = false,
}: {
  room: Room;
  members: RoomMember[];
  currentUserId: string;
  messages?: Message[];
  onSend?: (content: string, as?: SpeakAs) => Promise<string | null>;
  speakAsOptions?: SpeakAsOption[];
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
  roomBg?: RoomBg;
  personalBg?: PersonalBg;
  bgUploading?: null | "room" | "personal";
  onSetRoomBgOpacity?: (v: number) => void;
  onSetRoomBgBlur?: (v: number) => void;
  onSetPersonalBgOpacity?: (v: number) => void;
  onSetPersonalBgBlur?: (v: number) => void;
  onUploadRoomBg?: (file: File) => Promise<string | null>;
  onClearRoomBg?: () => void;
  onUploadPersonalBg?: (file: File) => Promise<string | null>;
  onClearPersonalBg?: () => void;
  showRoomActions?: boolean;
}) {
  const [bgMode, setBgMode] = useState<BgMode>("room");
  // KP 默认开「KP 视角」看到暗骰；PL 恒为 PL 视角
  const [kpView, setKpView] = useState(isKp);
  // 左侧栏翻面：false=成员/人物卡（正面），true=设置（背面）
  const [settingsOpen, setSettingsOpen] = useState(false);
  // 人物卡编辑器（null=关闭；character=null 表示新建）
  const [editor, setEditor] = useState<{
    character: Character | null;
    mode: "pc" | "npc";
  } | null>(null);

  const openEditor = (character: Character | null, mode: "pc" | "npc") =>
    setEditor({ character, mode });

  // 发言身份选中态：聊天框 chip 与右侧快捷骰共用（互相同步）
  const [speakAsKey, setSpeakAsKey] = useState<string | null>(
    activeCharacterId ? `pc-${activeCharacterId}` : null
  );
  // 活跃角色被外部更新时（如新建 PC 自动选中）同步到身份 chip
  useEffect(() => {
    if (activeCharacterId) setSpeakAsKey(`pc-${activeCharacterId}`);
  }, [activeCharacterId]);
  const handleSelectKey = (key: string) => {
    setSpeakAsKey(key);
    const opt = speakAsOptions.find((o) => o.key === key);
    if (opt?.characterId) onSelectCharacter?.(opt.characterId);
  };

  // 演示页未注入实时背景时，回退到共享背景图 + 默认本人视角
  const bg: RoomBg = roomBg ?? {
    custom: room.bgCustom,
    opacity: 0.15,
    blur: 0,
  };
  const personal: PersonalBg = personalBg ?? { url: null, opacity: 1, blur: 0 };

  return (
    <div className="h-dvh w-full overflow-x-auto text-foreground">
      <div className="grid h-full min-w-[960px] grid-cols-[240px_minmax(0,1fr)_280px] gap-3 p-3">
        {/* 左侧栏：正面成员/人物卡，翻面后显示设置 */}
        <div className="flip-scene">
          <div className={`flip-inner ${settingsOpen ? "flipped" : ""}`}>
            <div className="flip-face">
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
                showRoomActions={showRoomActions}
                onOpenSettings={showRoomActions ? () => setSettingsOpen(true) : undefined}
              />
            </div>
            <div className="flip-face flip-back">
              <RoomSettingsPanel
                room={room}
                isKp={isKp}
                onClose={() => setSettingsOpen(false)}
                bgMode={bgMode}
                setBgMode={setBgMode}
                kpView={kpView}
                setKpView={setKpView}
                roomBg={bg}
                personalBg={personal}
                uploading={bgUploading}
                onSetRoomBgOpacity={onSetRoomBgOpacity}
                onSetRoomBgBlur={onSetRoomBgBlur}
                onSetPersonalBgOpacity={onSetPersonalBgOpacity}
                onSetPersonalBgBlur={onSetPersonalBgBlur}
                onUploadRoomBg={onUploadRoomBg}
                onClearRoomBg={onClearRoomBg}
                onUploadPersonalBg={onUploadPersonalBg}
                onClearPersonalBg={onClearPersonalBg}
              />
            </div>
          </div>
        </div>

        <ChatLog
          roomName={room.name}
          roomStatus={room.status}
          messages={messages}
          revealHidden={kpView}
          bgMode={bgMode}
          roomBg={bg}
          personalBg={personal}
          onSend={onSend}
          speakAsOptions={speakAsOptions}
          selectedKey={speakAsKey}
          onSelectKey={handleSelectKey}
          currentUserId={currentUserId}
          connectionStatus={connectionStatus}
        />
        <DicePanel
          speakAsOptions={speakAsOptions}
          selectedKey={speakAsKey}
          onSelectKey={handleSelectKey}
          characters={characters}
          activeCharacterId={activeCharacterId}
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
