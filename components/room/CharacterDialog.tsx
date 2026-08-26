"use client";

import { useState } from "react";
import type { Skill } from "@/lib/types";

type SkillDraft = { name: string; value: string };

/** 新建角色弹层：角色名 + 技能编辑器（名称/数值多行） */
export default function CharacterDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, skills: Skill[]) => Promise<string | null>;
}) {
  const [name, setName] = useState("");
  const [skills, setSkills] = useState<SkillDraft[]>([{ name: "", value: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function patchSkill(i: number, patch: Partial<SkillDraft>) {
    setSkills((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function addSkill() {
    setSkills((prev) => [...prev, { name: "", value: "" }]);
  }
  function removeSkill(i: number) {
    setSkills((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  }

  async function submit() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("请填写角色名");
      return;
    }

    const parsed: Skill[] = [];
    for (const s of skills) {
      const skillName = s.name.trim();
      const rawValue = s.value.trim();
      if (!skillName && !rawValue) continue; // 完全空行跳过
      if (!skillName) {
        setError("技能名不能为空");
        return;
      }
      if (rawValue === "") {
        setError(`技能「${skillName}」缺少数值`);
        return;
      }
      const v = Number(rawValue);
      if (!Number.isFinite(v) || v < 0 || v > 100) {
        setError(`技能「${skillName}」的数值需在 0-100 之间`);
        return;
      }
      parsed.push({ name: skillName, value: Math.round(v), isBase: true });
    }
    if (parsed.length === 0) {
      setError("请至少添加一个技能");
      return;
    }

    setBusy(true);
    setError(null);
    const err = await onCreate(trimmedName, parsed);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="glass-strong w-full max-w-md rounded-3xl p-5">
        <h2 className="text-base font-semibold text-foreground">新建角色</h2>
        <p className="mt-0.5 text-[11px] text-muted">仅骰子所需：角色名 + 技能列表</p>

        <label className="mt-4 block">
          <span className="text-xs text-muted">角色名</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="如：调查员·王"
            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent/50 focus:outline-none focus:ring-4 focus:ring-accent/20"
          />
        </label>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-muted">技能（名称 + 数值 0-100）</span>
            <button
              type="button"
              onClick={addSkill}
              className="text-xs font-medium text-accent hover:opacity-80"
            >
              + 添加技能
            </button>
          </div>
          <div className="space-y-1.5">
            {skills.map((s, i) => (
              <div key={i} className="flex gap-1.5">
                <input
                  type="text"
                  value={s.name}
                  onChange={(e) => patchSkill(i, { name: e.target.value })}
                  placeholder="技能名，如 侦查"
                  className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted focus:border-accent/50 focus:outline-none"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={s.value}
                  onChange={(e) => patchSkill(i, { value: e.target.value })}
                  placeholder="50"
                  className="w-20 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted focus:border-accent/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeSkill(i)}
                  disabled={skills.length === 1}
                  className="shrink-0 rounded-lg px-2 text-sm text-muted hover:text-foreground disabled:opacity-30"
                  aria-label="删除"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="mt-3 text-[11px] text-red-600 dark:text-red-300">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-foreground/5 px-4 py-2 text-sm text-foreground transition-colors duration-300 hover:bg-foreground/10"
          >
            取消
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-all duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "创建中…" : "创建"}
          </button>
        </div>
      </div>
    </div>
  );
}
