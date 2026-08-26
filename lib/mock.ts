import type { Character, Message, Room, RoomMember, User } from "./types";
import { judgeRoll } from "./dice";
import { resolveAvatarUrl, svgAvatar } from "./avatar";

// —— 头像（内联 SVG data URI，模拟真实图片 URL）——
const charAvatarAlice = svgAvatar("#0d9488", "艾"); // 爱丽丝的人物卡头像
const charAvatarNpc = svgAvatar("#b45309", "塞"); // 老管家 NPC 头像
const memberAvatarBob = svgAvatar("#2563eb", "鲍"); // 鲍勃的房间级头像
const userAvatarCarol = svgAvatar("#db2777", "卡"); // 卡萝的全局头像
const userAvatarKp = svgAvatar("#7c3aed", "夜"); // KP 夜鸦的全局头像
const userAvatarAlice = svgAvatar("#0ea5e9", "爱"); // 爱丽丝的全局头像（被人物卡头像覆盖）

// —— 用户 ——
const users: Record<string, User> = {
  kp: { id: "u-kp", username: "夜鸦", avatarUrl: userAvatarKp },
  alice: { id: "u-alice", username: "爱丽丝", avatarUrl: userAvatarAlice },
  bob: { id: "u-bob", username: "鲍勃", avatarUrl: null },
  carol: { id: "u-carol", username: "卡萝", avatarUrl: userAvatarCarol },
  dave: { id: "u-dave", username: "戴夫", avatarUrl: null },
  spectator: { id: "u-spec", username: "路人甲", avatarUrl: null },
};

// —— 人物卡 ——
const charAlice: Character = {
  id: "c-alice", name: "艾莉西亚·哈特", occupation: "调查记者", age: 28,
  str: 45, con: 50, siz: 55, dex: 70, app: 65, int: 75, pow: 60, edu: 80,
  hp: 11, hpMax: 11, san: 55, sanMax: 60, mp: 12, mpMax: 12,
  isNpc: false, isHidden: false, avatarUrl: charAvatarAlice, ownerId: "u-alice",
  status: "normal",
  skills: [
    { name: "侦查", value: 50, isBase: true },
    { name: "图书馆使用", value: 55, isBase: true },
    { name: "心理学", value: 40, isBase: false },
  ],
};

const charBob: Character = {
  id: "c-bob", name: "罗伯特·米勒", occupation: "私家侦探", age: 42,
  str: 60, con: 65, siz: 60, dex: 55, app: 40, int: 60, pow: 45, edu: 60,
  hp: 13, hpMax: 13, san: 45, sanMax: 45, mp: 9, mpMax: 9,
  isNpc: false, isHidden: false, avatarUrl: null, ownerId: "u-bob",
  status: "normal",
  skills: [
    { name: "聆听", value: 60, isBase: true },
    { name: "潜行", value: 45, isBase: false },
  ],
};

const charCarol: Character = {
  id: "c-carol", name: "卡罗琳·普莱斯", occupation: "考古学家", age: 35,
  str: 40, con: 45, siz: 45, dex: 60, app: 60, int: 70, pow: 65, edu: 85,
  hp: 9, hpMax: 9, san: 65, sanMax: 65, mp: 13, mpMax: 13,
  isNpc: false, isHidden: false, avatarUrl: null, ownerId: "u-carol",
  status: "normal",
  skills: [
    { name: "潜行", value: 50, isBase: false },
    { name: "图书馆使用", value: 70, isBase: true },
  ],
};

const charDave: Character = {
  id: "c-dave", name: "大卫·陈", occupation: "医学生", age: 24,
  str: 50, con: 55, siz: 50, dex: 50, app: 55, int: 65, pow: 55, edu: 75,
  hp: 11, hpMax: 11, san: 50, sanMax: 55, mp: 11, mpMax: 11,
  isNpc: false, isHidden: false, avatarUrl: null, ownerId: "u-dave",
  status: "normal",
  skills: [
    { name: "急救", value: 70, isBase: true },
    { name: "心理学", value: 40, isBase: false },
  ],
};

const charNpc: Character = {
  id: "c-npc-sebastian", name: "塞巴斯蒂安·科尔", occupation: "老管家", age: 68,
  str: 35, con: 40, siz: 50, dex: 40, app: 45, int: 60, pow: 55, edu: 65,
  hp: 9, hpMax: 9, san: 30, sanMax: 55, mp: 11, mpMax: 11,
  isNpc: true, isHidden: true, avatarUrl: charAvatarNpc, ownerId: null,
  status: "normal",
  skills: [],
};

export const characters: Character[] = [
  charAlice,
  charBob,
  charCarol,
  charDave,
  charNpc,
];

// —— 成员（头像来源依次命中：人物卡 / 房间 / 全局 / 默认）——
export const members: RoomMember[] = [
  { userId: "u-kp", role: "kp", avatarUrl: null, bgPersonal: null, user: users.kp, character: null },
  { userId: "u-alice", role: "pl", avatarUrl: null, bgPersonal: null, user: users.alice, character: charAlice },
  { userId: "u-bob", role: "pl", avatarUrl: memberAvatarBob, bgPersonal: null, user: users.bob, character: charBob },
  { userId: "u-carol", role: "pl", avatarUrl: null, bgPersonal: null, user: users.carol, character: charCarol },
  { userId: "u-dave", role: "pl", avatarUrl: null, bgPersonal: null, user: users.dave, character: charDave },
  { userId: "u-spec", role: "spectator", avatarUrl: null, bgPersonal: null, user: users.spectator, character: null },
];

export const currentUserId = "u-alice";
export const currentCharacter = charAlice;

// —— 房间 ——
export const room: Room = {
  id: "r-1",
  code: "DEMO12",
  name: "暗雾镇侦探社 · 第三章",
  status: "running",
  maxPlayers: 5,
  hostId: "u-kp",
  bgCustom: null, // 真实数据为图片 URL，Background 组件内用渐变模拟
  bgOpacity: 0.15,
  bgBlur: 0,
};

function senderAvatarFor(userId: string): string | null {
  const m = members.find((x) => x.userId === userId);
  return m ? resolveAvatarUrl(m) : null;
}

// —— 消息（覆盖全部 6 种类型 + 骰子 6 级 + 暗骰）——
export const messages: Message[] = [
  { id: "m1", type: "system", senderName: "", senderRole: "system", senderAvatar: null, content: "房间已创建 · 守秘人「夜鸦」主持本场跑团", timestamp: "20:00" },
  { id: "m2", type: "system", senderName: "", senderRole: "system", senderAvatar: null, content: "爱丽丝 加入了房间", timestamp: "20:01" },
  { id: "m3", type: "narrate", senderName: "夜鸦", senderRole: "kp", senderAvatar: senderAvatarFor("u-kp"), content: "1926 年，阿卡姆。连绵阴雨已经下了整整一周，把「暗雾镇」的鹅卵石街道泡得发亮。你们各自收到一封没有署名的电报，邀请今晚九点前往镇郊的布莱克伍德宅邸。", timestamp: "20:05" },
  { id: "m4", type: "chat", senderName: "艾莉西亚·哈特", senderRole: "pl", senderAvatar: senderAvatarFor("u-alice"), content: "这封电报的署名被墨水晕开了……你们有谁听说过布莱克伍德家吗？", timestamp: "20:06" },
  { id: "m5", type: "chat", senderName: "罗伯特·米勒", senderRole: "pl", senderAvatar: senderAvatarFor("u-bob"), content: "管他是谁，给钱就干。我到后门去踩个点。", timestamp: "20:07" },
  { id: "m6", type: "npc", senderName: "塞巴斯蒂安·科尔", senderRole: "npc", senderAvatar: charAvatarNpc, content: "（老管家举起一盏煤油灯，声音发颤）少爷他……从昨天夜里起就不见了。", timestamp: "20:10" },
  { id: "m7", type: "ooc", senderName: "卡萝", senderRole: "pl", senderAvatar: null, content: "这条先不算数，我角色还在门外没进来呢。", timestamp: "20:11" },
  { id: "m8", type: "dice", senderName: "艾莉西亚·哈特", senderRole: "pl", senderAvatar: senderAvatarFor("u-alice"), content: "仔细搜查书房", timestamp: "20:13", rollLabel: "侦查", rollResult: 40, rollTarget: 50, rollLevel: judgeRoll(40, 50) },
  { id: "m9", type: "dice", senderName: "罗伯特·米勒", senderRole: "pl", senderAvatar: senderAvatarFor("u-bob"), content: "贴着门听里面的动静", timestamp: "20:14", rollLabel: "聆听", rollResult: 9, rollTarget: 60, rollLevel: judgeRoll(9, 60) },
  { id: "m10", type: "dice", senderName: "卡罗琳·普莱斯", senderRole: "pl", senderAvatar: senderAvatarFor("u-carol"), content: "在藏书室翻阅旧报纸", timestamp: "20:16", rollLabel: "图书馆使用", rollResult: 24, rollTarget: 55, rollLevel: judgeRoll(24, 55) },
  { id: "m11", type: "dice", senderName: "大卫·陈", senderRole: "pl", senderAvatar: senderAvatarFor("u-dave"), content: "给晕倒的佣人做急救", timestamp: "20:18", rollLabel: "急救", rollResult: 3, rollTarget: 70, rollLevel: judgeRoll(3, 70) },
  { id: "m12", type: "dice", senderName: "大卫·陈", senderRole: "pl", senderAvatar: senderAvatarFor("u-dave"), content: "观察老管家是否在说谎", timestamp: "20:20", rollLabel: "心理学", rollResult: 61, rollTarget: 40, rollLevel: judgeRoll(61, 40) },
  { id: "m13", type: "dice", senderName: "卡罗琳·普莱斯", senderRole: "pl", senderAvatar: senderAvatarFor("u-carol"), content: "蹑手蹑脚地靠近地窖", timestamp: "20:22", rollLabel: "潜行", rollResult: 98, rollTarget: 50, rollLevel: judgeRoll(98, 50) },
  { id: "m14", type: "dice", senderName: "夜鸦", senderRole: "kp", senderAvatar: senderAvatarFor("u-kp"), content: "", timestamp: "20:24", rollLabel: "潜行（暗骰）", rollResult: 12, rollTarget: 60, rollLevel: judgeRoll(12, 60), isHidden: true },
  { id: "m15", type: "dice", senderName: "罗伯特·米勒", senderRole: "pl", senderAvatar: senderAvatarFor("u-bob"), content: "对窗户玻璃砸了一拳", timestamp: "20:25", rollLabel: "1d6+db", rollResult: 7 },
  { id: "m16", type: "narrate", senderName: "夜鸦", senderRole: "kp", senderAvatar: senderAvatarFor("u-kp"), content: "就在鲍勃的拳头砸碎玻璃的瞬间，宅邸深处传来一阵低沉的笑声，仿佛正有人等待多时……", timestamp: "20:26" },
];
