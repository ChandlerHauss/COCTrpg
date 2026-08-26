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
  bgOpacity: number;
}

export interface Message {
  id: string;
  type: MessageType;
  senderName: string;
  senderRole?: Role | "npc" | "system";
  senderAvatar: string | null;
  content: string;
  timestamp: string;
  // 骰子相关字段
  rollLabel?: string;
  rollResult?: number;
  rollTarget?: number;
  rollLevel?: RollLevel;
  isHidden?: boolean;
}
