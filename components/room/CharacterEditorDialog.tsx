"use client";

import { useState } from "react";
import type { Character, CharacterInput, CharacterStatus, Skill } from "@/lib/types";
import { defaultCharacterInput, deriveDerivedStats, isCharacterHiddenTo } from "@/lib/character";
import Avatar from "./messages/Avatar";

type SkillDraft = { name: string; value: string };

const inputCls =
  "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent/50 focus:outline-none focus:ring-4 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60";
const numCls =
  "w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground focus:border-accent/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

const ATTRS = [
  { key: "str", label: "STR 力量" },
  { key: "con", label: "CON 体质" },
  { key: "siz", label: "SIZ 体型" },
  { key: "dex", label: "DEX 敏捷" },
  { key: "app", label: "APP 外貌" },
  { key: "int", label: "INT 智力" },
  { key: "pow", label: "POW 意志" },
  { key: "edu", label: "EDU 教育" },
] as const;
type AttrKey = (typeof ATTRS)[number]["key"];

const STATUS_OPTIONS: { v: CharacterStatus; label: string }[] = [
  { v: "normal", label: "正常" },
  { v: "temp_insane", label: "临时疯狂" },
  { v: "indefinite_insane", label: "不定性疯狂" },
  { v: "perm_insane", label: "永久疯狂" },
];

/** 完整人物卡编辑弹层：COC 7 字段 + 头像上传 + 技能；创建/编辑 PC 与 NPC 共用 */
export default function CharacterEditorDialog({
  character,
  mode,
  isKp,
  userId,
  onClose,
  onSave,
  uploadAvatar,
}: {
  character: Character | null;
  mode: "pc" | "npc";
  isKp: boolean;
  userId: string;
  onClose: () => void;
  onSave: (input: CharacterInput, id?: string) => Promise<string | null>;
  uploadAvatar: (file: File) => Promise<string | null>;
}) {
  const isOwner = character != null && character.ownerId === userId;
  const canEdit = character == null || isKp || isOwner;
  const masked =
    character != null && isCharacterHiddenTo(character, { isOwner, isKp });

  const [form, setForm] = useState<CharacterInput>(() => {
    if (character) {
      const { id: _id, ownerId: _ownerId, ...rest } = character;
      return rest;
    }
    return { ...defaultCharacterInput(), isNpc: mode === "npc" };
  });
  const [skills, setSkills] = useState<SkillDraft[]>(() => {
    const s = (character?.skills ?? []).map((x) => ({
      name: x.name,
      value: String(x.value),
    }));
    return s.length ? s : [{ name: "", value: "" }];
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);

  function patch(p: Partial<CharacterInput>) {
    setForm((f) => ({ ...f, ...p }));
  }
  function patchAttribute(key: AttrKey, raw: string) {
    const n = Number(raw);
    const v = Number.isFinite(n) ? Math.max(0, Math.min(99, n)) : 0;
    setForm((f) => {
      const next = { ...f, [key]: v };
      if (key === "con" || key === "siz" || key === "pow") {
        const d = deriveDerivedStats(next.con, next.siz, next.pow);
        return { ...next, hpMax: d.hpMax, sanMax: d.sanMax, mpMax: d.mpMax };
      }
      return next;
    });
  }
  function patchNum(key: keyof CharacterInput, raw: string) {
    const n = Number(raw);
    setForm((f) => ({
      ...f,
      [key]: Number.isFinite(n) ? Math.max(0, Math.min(999, n)) : 0,
    }));
  }

  function patchSkill(i: number, p: Partial<SkillDraft>) {
    setSkills((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...p } : s)));
  }
  function addSkill() {
    setSkills((prev) => [...prev, { name: "", value: "" }]);
  }
  function removeSkill(i: number) {
    setSkills((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("请选择图片文件");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("图片不能超过 2MB");
      return;
    }
    setAvatarBusy(true);
    setError(null);
    const url = await uploadAvatar(file);
    setAvatarBusy(false);
    if (!url) {
      setError("头像上传失败，请重试");
      return;
    }
    patch({ avatarUrl: url });
  }

  async function submit() {
    if (!form.name.trim()) {
      setError("请填写角色名");
      return;
    }
    const parsed: Skill[] = [];
    for (const s of skills) {
      const name = s.name.trim();
      const raw = s.value.trim();
      if (!name && !raw) continue;
      if (!name) {
        setError("技能名不能为空");
        return;
      }
      if (raw === "") {
        setError(`技能「${name}」缺少数值`);
        return;
      }
      const v = Number(raw);
      if (!Number.isFinite(v) || v < 0 || v > 100) {
        setError(`技能「${name}」的数值需在 0-100 之间`);
        return;
      }
      parsed.push({ name, value: Math.round(v), isBase: true });
    }

    setBusy(true);
    setError(null);
    const err = await onSave({ ...form, name: form.name.trim(), skills: parsed }, character?.id);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="glass-strong flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {character ? (mode === "npc" ? "编辑 NPC" : "编辑角色") : mode === "npc" ? "新建 NPC" : "新建角色"}
            </h2>
            <p className="mt-0.5 text-[11px] text-muted">COC 7 版人物卡</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 text-sm text-muted hover:text-foreground"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        {masked ? (
          <div className="mt-6 flex flex-col items-center gap-3 py-8 text-center">
            <Avatar url={form.avatarUrl} username={form.name} size="lg" />
            <p className="text-sm font-medium text-foreground">{form.name}</p>
            <p className="text-xs text-muted">🔒 该 NPC 属性已隐藏，仅守秘人可见</p>
          </div>
        ) : (
          <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
            {/* 头像 */}
            <div className="flex items-center gap-3">
              <Avatar url={form.avatarUrl} username={form.name || "?"} size="lg" />
              <div className="flex flex-col gap-1">
                {canEdit && (
                  <label className="cursor-pointer text-xs font-medium text-accent hover:opacity-80">
                    {avatarBusy ? "上传中…" : form.avatarUrl ? "更换头像" : "上传头像"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={avatarBusy}
                      onChange={onFile}
                    />
                  </label>
                )}
                {canEdit && form.avatarUrl && (
                  <button
                    type="button"
                    onClick={() => patch({ avatarUrl: null })}
                    className="text-left text-[11px] text-muted hover:text-foreground"
                  >
                    移除头像
                  </button>
                )}
              </div>
            </div>

            {/* 基本信息 */}
            <div className="grid grid-cols-3 gap-2">
              <label className="col-span-2">
                <span className="text-xs text-muted">角色名</span>
                <input
                  type="text"
                  value={form.name}
                  disabled={!canEdit}
                  onChange={(e) => patch({ name: e.target.value })}
                  placeholder="角色名"
                  className={`mt-1 ${inputCls}`}
                />
              </label>
              <label>
                <span className="text-xs text-muted">年龄</span>
                <input
                  type="number"
                  min={0}
                  value={form.age}
                  disabled={!canEdit}
                  onChange={(e) => patchNum("age", e.target.value)}
                  className={`mt-1 ${inputCls}`}
                />
              </label>
            </div>
            <label className="block">
              <span className="text-xs text-muted">职业</span>
              <input
                type="text"
                value={form.occupation}
                disabled={!canEdit}
                onChange={(e) => patch({ occupation: e.target.value })}
                placeholder="如：调查记者"
                className={`mt-1 ${inputCls}`}
              />
            </label>

            {/* 8 维属性 */}
            <div>
              <span className="text-xs text-muted">属性</span>
              <div className="mt-1 grid grid-cols-4 gap-1.5">
                {ATTRS.map((a) => (
                  <label key={a.key} className="flex flex-col">
                    <span className="text-[10px] text-muted">{a.label}</span>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={form[a.key]}
                      disabled={!canEdit}
                      onChange={(e) => patchAttribute(a.key, e.target.value)}
                      className={numCls}
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* HP / SAN / MP */}
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { k: "hp", km: "hpMax", label: "生命值 HP" },
                  { k: "san", km: "sanMax", label: "理智 SAN" },
                  { k: "mp", km: "mpMax", label: "魔法 MP" },
                ] as const
              ).map((g) => (
                <div key={g.k}>
                  <span className="text-xs text-muted">{g.label}</span>
                  <div className="mt-1 flex items-center gap-1">
                    <input
                      type="number"
                      value={form[g.k]}
                      disabled={!canEdit}
                      onChange={(e) => patchNum(g.k, e.target.value)}
                      className={numCls}
                      aria-label={`${g.label} 当前`}
                    />
                    <span className="text-muted">/</span>
                    <input
                      type="number"
                      value={form[g.km]}
                      disabled={!canEdit}
                      onChange={(e) => patchNum(g.km, e.target.value)}
                      className={numCls}
                      aria-label={`${g.label} 上限`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 理智状态 */}
            <label className="block">
              <span className="text-xs text-muted">理智状态</span>
              <select
                value={form.status}
                disabled={!canEdit}
                onChange={(e) => patch({ status: e.target.value as CharacterStatus })}
                className={`mt-1 ${inputCls}`}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            {/* NPC：是否隐藏属性 */}
            {mode === "npc" && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isHidden}
                  disabled={!canEdit}
                  onChange={(e) => patch({ isHidden: e.target.checked })}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                <span className="text-xs text-muted">隐藏属性（PL 仅见姓名与头像）</span>
              </label>
            )}

            {/* 技能 */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-muted">技能（名称 + 数值 0-100）</span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={addSkill}
                    className="text-xs font-medium text-accent hover:opacity-80"
                  >
                    + 添加技能
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                {skills.map((s, i) => (
                  <div key={i} className="flex gap-1.5">
                    <input
                      type="text"
                      value={s.name}
                      disabled={!canEdit}
                      onChange={(e) => patchSkill(i, { name: e.target.value })}
                      placeholder="技能名，如 侦查"
                      className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted focus:border-accent/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={s.value}
                      disabled={!canEdit}
                      onChange={(e) => patchSkill(i, { value: e.target.value })}
                      placeholder="50"
                      className="w-20 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted focus:border-accent/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => removeSkill(i)}
                        disabled={skills.length === 1}
                        className="shrink-0 rounded-lg px-2 text-sm text-muted hover:text-foreground disabled:opacity-30"
                        aria-label="删除"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && <p className="mt-3 text-[11px] text-red-600 dark:text-red-300">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-foreground/5 px-4 py-2 text-sm text-foreground transition-colors duration-300 hover:bg-foreground/10"
          >
            {canEdit ? "取消" : "关闭"}
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-all duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? "保存中…" : "保存"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
