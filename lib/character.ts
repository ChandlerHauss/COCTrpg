import type { Character, CharacterInput, CharacterStatus, Skill } from "./types";

/** characters 表的行形状（snake_case，含 Phase 4 旧最小行兼容） */
export type CharacterRow = {
  id: string;
  owner_id: string | null;
  name: string;
  occupation?: string | null;
  age?: number | null;
  str?: number | null;
  con?: number | null;
  siz?: number | null;
  dex?: number | null;
  app?: number | null;
  int?: number | null;
  pow?: number | null;
  edu?: number | null;
  hp?: number | null;
  hp_max?: number | null;
  san?: number | null;
  san_max?: number | null;
  mp?: number | null;
  mp_max?: number | null;
  status?: CharacterStatus | null;
  is_npc?: boolean | null;
  is_hidden?: boolean | null;
  avatar_url?: string | null;
  room_id?: string | null;
  skills?: unknown;
};

const num = (v: number | null | undefined) => (v ?? 0);

/** DB 行 → Character；Phase 4 旧最小行（缺列）补默认值 */
export function rowToCharacter(row: CharacterRow): Character {
  return {
    id: row.id,
    name: row.name,
    occupation: row.occupation ?? "",
    age: num(row.age),
    str: num(row.str),
    con: num(row.con),
    siz: num(row.siz),
    dex: num(row.dex),
    app: num(row.app),
    int: num(row.int),
    pow: num(row.pow),
    edu: num(row.edu),
    hp: num(row.hp),
    hpMax: num(row.hp_max),
    san: num(row.san),
    sanMax: num(row.san_max),
    mp: num(row.mp),
    mpMax: num(row.mp_max),
    isNpc: row.is_npc === true,
    isHidden: row.is_hidden === true,
    avatarUrl: row.avatar_url ?? null,
    ownerId: row.owner_id ?? null,
    status: row.status ?? "normal",
    skills: Array.isArray(row.skills) ? (row.skills as Skill[]) : [],
  };
}

/** 可编辑字段 → 写库列（不含 owner_id，由调用方按 insert/update 追加） */
export function characterInputToRow(
  input: CharacterInput,
  roomId: string
): Record<string, unknown> {
  return {
    name: input.name,
    occupation: input.occupation,
    age: input.age,
    str: input.str,
    con: input.con,
    siz: input.siz,
    dex: input.dex,
    app: input.app,
    int: input.int,
    pow: input.pow,
    edu: input.edu,
    hp: input.hp,
    hp_max: input.hpMax,
    san: input.san,
    san_max: input.sanMax,
    mp: input.mp,
    mp_max: input.mpMax,
    status: input.status,
    is_npc: input.isNpc,
    is_hidden: input.isHidden,
    avatar_url: input.avatarUrl,
    skills: input.skills,
    room_id: input.isNpc ? roomId : null,
  };
}

/** COC 7 派生值：hpMax=(con+siz)/10、sanMax=pow、mpMax=pow/5 */
export function deriveDerivedStats(
  con: number,
  siz: number,
  pow: number
): { hpMax: number; sanMax: number; mpMax: number } {
  return {
    hpMax: Math.floor((con + siz) / 10),
    sanMax: pow,
    mpMax: Math.floor(pow / 5),
  };
}

/** 空表单默认值 */
export function defaultCharacterInput(): CharacterInput {
  return {
    name: "",
    occupation: "",
    age: 0,
    str: 50,
    con: 50,
    siz: 50,
    dex: 50,
    app: 50,
    int: 50,
    pow: 50,
    edu: 50,
    hp: 10,
    hpMax: 10,
    san: 50,
    sanMax: 50,
    mp: 10,
    mpMax: 10,
    isNpc: false,
    isHidden: false,
    avatarUrl: null,
    status: "normal",
    skills: [],
  };
}

/** 隐藏 NPC 对「非 owner 且非 KP」的观众遮蔽属性/技能 */
export function isCharacterHiddenTo(
  c: Character,
  viewer: { isOwner: boolean; isKp: boolean }
): boolean {
  return c.isHidden && !viewer.isOwner && !viewer.isKp;
}
