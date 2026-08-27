export type Role = "kp" | "pl" | "spectator";
export type ConnectionStatus = "connecting" | "connected" | "disconnected";
export type MessageType = "chat" | "narrate" | "dice" | "system" | "ooc" | "npc";
export type RollLevel =
  | "critical"
  | "extreme"
  | "hard"
  | "success"
  | "fail"
  | "fumble";
export type CharacterStatus =
  | "normal"
  | "temp_insane"
  | "indefinite_insane"
  | "perm_insane";

export interface Skill {
  name: string;
  value: number;
  isBase: boolean;
}

export interface Character {
  id: string;
  name: string;
  occupation: string;
  age: number;
  str: number;
  con: number;
  siz: number;
  dex: number;
  app: number;
  int: number;
  pow: number;
  edu: number;
  hp: number;
  hpMax: number;
  san: number;
  sanMax: number;
  mp: number;
  mpMax: number;
  isNpc: boolean;
  isHidden: boolean;
  avatarUrl: string | null;
  ownerId: string | null;
  status: CharacterStatus;
  skills: Skill[];
}

/** 人物卡可编辑字段（不含 id / ownerId，创建与更新共用） */
export type CharacterInput = Omit<Character, "id" | "ownerId">;

export interface User {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface RoomMember {
  userId: string;
  role: Role;
  avatarUrl: string | null;
  bgPersonal: string | null;
  bgPersonalOpacity: number;
  bgPersonalBlur: number;
  bgRoomOpacity: number;
  bgRoomBlur: number;
  user: User;
  character: Character | null;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  status: "waiting" | "running" | "paused" | "archived";
  maxPlayers: number;
  hostId: string;
  bgCustom: string | null;
  hasPassword: boolean;
}

/** 发言身份：聊天/骰子消息按此身份显示姓名、头像、角色与技能 */
export interface SpeakAs {
  name: string;
  avatarUrl: string | null;
  role: Role | "npc";
  type: "chat" | "npc"; // 决定消息渲染类型（骰子消息恒为 "dice"，忽略此字段）
  skills?: Skill[]; // 该身份的技能（人物卡/NPC 时，用于 /r 技能 判定）
}

/** 身份选择器的一项（key 用于 React key + 选中态） */
export interface SpeakAsOption {
  key: string;
  as: SpeakAs;
  /** 对应的人物卡 id（仅 PC 选项，用于把选中 PC 持久化为活跃角色） */
  characterId?: string;
}

export interface Message {
  id: string;
  type: MessageType;
  senderName: string;
  senderRole?: Role | "npc" | "system";
  senderAvatar: string | null;
  senderId: string | null; // 用于「自己靠右」分栏；system 消息为 null
  content: string;
  timestamp: string;
  // 骰子相关字段
  rollLabel?: string;
  rollResult?: number;
  rollTarget?: number;
  rollLevel?: RollLevel;
  isHidden?: boolean;
}
