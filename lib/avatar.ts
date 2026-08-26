import type { RoomMember } from "./types";

export type AvatarSource = "character" | "member" | "user" | "default";

// 默认头像底色（确定性取色，保证同名稳定）
const PALETTE = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-yellow-500",
  "bg-lime-500",
  "bg-green-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-pink-500",
  "bg-rose-500",
];

/** 默认头像：用户名首字母 + 确定性底色 */
export function defaultAvatar(username: string): {
  initial: string;
  color: string;
} {
  const initial = (username.trim().charAt(0) || "?").toUpperCase();
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
  }
  return { initial, color: PALETTE[hash % PALETTE.length] };
}

/**
 * 头像优先级（从高到低）：
 * characters.avatar_url > room_members.avatar_url > users.avatar_url > 默认
 */
export function resolveAvatarUrl(member: RoomMember): string | null {
  if (member.character?.avatarUrl) return member.character.avatarUrl;
  if (member.avatarUrl) return member.avatarUrl;
  if (member.user.avatarUrl) return member.user.avatarUrl;
  return null;
}

/** 命中哪一级头像来源（用于原型中显式展示优先级） */
export function avatarSource(member: RoomMember): AvatarSource {
  if (member.character?.avatarUrl) return "character";
  if (member.avatarUrl) return "member";
  if (member.user.avatarUrl) return "user";
  return "default";
}

/** 生成一个内联 SVG data URI，作为 mock 头像（替代真实图片 URL，离线可用） */
export function svgAvatar(bg: string, label: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">` +
    `<rect width="96" height="96" rx="48" fill="${bg}"/>` +
    `<text x="48" y="53" text-anchor="middle" font-family="sans-serif" font-size="44" fill="#ffffff">${label}</text>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
