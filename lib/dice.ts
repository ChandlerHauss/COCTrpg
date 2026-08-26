import type { RollLevel } from "./types";

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
  { label: string; emoji: string; textClass: string }
> = {
  critical: { label: "大成功", emoji: "🟢", textClass: "text-emerald-600 dark:text-emerald-300" },
  extreme: { label: "极难成功", emoji: "🔵", textClass: "text-blue-600 dark:text-blue-300" },
  hard: { label: "困难成功", emoji: "🟦", textClass: "text-sky-600 dark:text-sky-300" },
  success: { label: "成功", emoji: "⚪", textClass: "text-foreground" },
  fail: { label: "失败", emoji: "🔴", textClass: "text-red-600 dark:text-red-300" },
  fumble: { label: "大失败", emoji: "⚫", textClass: "text-muted" },
};
