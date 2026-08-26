import type { RollLevel, Skill } from "./types";

/** 掷一颗 d100（1-100） */
export function rollD100(): number {
  return Math.floor(Math.random() * 100) + 1;
}

/** 解析 /r /rh 指令的结果；非骰子指令返回 null */
export type ParsedRoll =
  | { kind: "skill"; skillName: string; hidden: boolean } // /r 侦查、/rh 侦查
  | { kind: "target"; target: number; hidden: boolean } // /r 50、/rh 50
  | { kind: "raw"; hidden: boolean }; // /r 1d100

export function parseDiceCommand(input: string): ParsedRoll | null {
  const s = input.trim();
  let hidden = false;
  let rest = "";
  if (s.startsWith("/rh")) {
    hidden = true;
    rest = s.slice(3).trim();
  } else if (s.startsWith("/r")) {
    rest = s.slice(2).trim();
  } else {
    return null;
  }
  if (!rest) return null;
  if (/^1d100$/i.test(rest)) return { kind: "raw", hidden };
  if (/^\d+$/.test(rest)) {
    const t = Number(rest);
    return t >= 1 && t <= 100 ? { kind: "target", target: t, hidden } : null;
  }
  return { kind: "skill", skillName: rest, hidden };
}

/** 在技能列表中按名称查值（大小写不敏感），找不到返回 null */
export function findSkillValue(skills: Skill[], name: string): number | null {
  const n = name.trim().toLowerCase();
  const found = skills.find((s) => s.name.trim().toLowerCase() === n);
  return found ? found.value : null;
}

/**
 * COC 7 版骰子判定（固定规则，不可改）：
 * - 大成功：1-5（固定范围，优先判定）
 * - 大失败：96-100（固定范围，优先判定）
 * - 极难成功：<= floor(技能/5)
 * - 困难成功：<= floor(技能/2)
 * - 普通成功：<= 技能
 * - 失败：> 技能
 */
export function judgeRoll(roll: number, skill: number): RollLevel {
  if (roll >= 1 && roll <= 5) return "critical";
  if (roll >= 96 && roll <= 100) return "fumble";
  if (roll <= Math.floor(skill / 5)) return "extreme";
  if (roll <= Math.floor(skill / 2)) return "hard";
  if (roll <= skill) return "success";
  return "fail";
}

export const ROLL_LEVEL_META: Record<
  RollLevel,
  { label: string; emoji: string; textClass: string; glow: string }
> = {
  critical: { label: "大成功", emoji: "🟢", textClass: "text-emerald-600 dark:text-emerald-300", glow: "rgba(16, 185, 129, 0.6)" },
  extreme: { label: "极难成功", emoji: "🔵", textClass: "text-blue-600 dark:text-blue-300", glow: "rgba(59, 130, 246, 0.6)" },
  hard: { label: "困难成功", emoji: "🟦", textClass: "text-sky-600 dark:text-sky-300", glow: "rgba(14, 165, 233, 0.6)" },
  success: { label: "成功", emoji: "⚪", textClass: "text-foreground", glow: "rgba(148, 163, 184, 0.5)" },
  fail: { label: "失败", emoji: "🔴", textClass: "text-red-600 dark:text-red-300", glow: "rgba(239, 68, 68, 0.6)" },
  fumble: { label: "大失败", emoji: "⚫", textClass: "text-muted", glow: "rgba(153, 27, 27, 0.75)" },
};
