"use client";

import { useState } from "react";
import type { Character } from "@/lib/types";
import type { BgMode } from "./Background";

export default function DicePanel({
  bgMode,
  setBgMode,
  kpView,
  setKpView,
  isKp,
  characters,
  activeCharacterId,
  onSelectCharacter,
  onNewCharacter,
  onSend,
}: {
  bgMode: BgMode;
  setBgMode: (m: BgMode) => void;
  kpView: boolean;
  setKpView: (v: boolean) => void;
  isKp: boolean;
  characters: Character[];
  activeCharacterId: string | null;
  onSelectCharacter?: (id: string) => Promise<void>;
  onNewCharacter?: () => void;
  onSend?: (input: string) => Promise<string | null>;
}) {
  const [activeSkill, setActiveSkill] = useState<string | null>(null);

  const activeCharacter = characters.find((c) => c.id === activeCharacterId) ?? null;
  const skills = activeCharacter?.skills ?? [];

  function quickRoll(hidden: boolean) {
    if (!activeSkill || !onSend) return;
    onSend(`${hidden ? "/rh" : "/r"} ${activeSkill}`);
  }

  return (
    <aside className="glass flex h-full flex-col gap-4 overflow-y-auto rounded-3xl p-4">
      {/* 暗骰可见性（仅 KP 可见/可切换） */}
      {isKp && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            暗骰可见性
          </h3>
          <div className="flex rounded-xl bg-foreground/5 p-0.5 text-xs">
            {(
              [
                { v: false, label: "PL 视角" },
                { v: true, label: "KP 视角" },
              ] as const
            ).map((o) => (
              <button
                key={String(o.v)}
                onClick={() => setKpView(o.v)}
                className={`flex-1 rounded-[10px] py-1.5 font-medium transition-all duration-300 ease-out ${
                  kpView === o.v
                    ? "bg-surface-strong text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[10px] text-muted">暗骰结果仅 KP 可见，PL 看到占位提示</p>
        </section>
      )}

      {/* 背景切换 */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">聊天背景</h3>
        <div className="flex rounded-xl bg-foreground/5 p-0.5 text-xs">
          {(
            [
              { v: "room", label: "跟随房间" },
              { v: "personal", label: "个人背景" },
            ] as const
          ).map((o) => (
            <button
              key={o.v}
              onClick={() => setBgMode(o.v)}
              className={`flex-1 rounded-[10px] py-1.5 font-medium transition-all duration-300 ease-out ${
                bgMode === o.v
                  ? "bg-surface-strong text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[10px] text-muted">个人背景覆盖房间背景，仅本机可见，可切回</p>
      </section>

      {/* 快捷指令 */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">骰子指令</h3>
        <ul className="space-y-1.5 font-mono text-[11px] text-muted">
          <li>
            <code className="text-accent">/r 侦查</code> 技能检定
          </li>
          <li>
            <code className="text-accent">/r 50</code> 固定目标检定
          </li>
          <li>
            <code className="text-accent">/rh 潜行</code> 暗骰（KP）
          </li>
          <li>
            <code className="text-accent">/r 1d100</code> 纯点数
          </li>
        </ul>
      </section>

      {/* 我的角色 + 技能快捷骰 */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">我的角色</h3>
        {characters.length === 0 ? (
          <div className="rounded-xl bg-foreground/5 p-3 text-center">
            <p className="text-[11px] text-muted">还没有角色，先建一张人物卡</p>
            <button
              type="button"
              onClick={() => onNewCharacter?.()}
              className="mt-2 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground transition-all duration-300 hover:opacity-90"
            >
              新建角色
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-1.5">
              <select
                value={activeCharacterId ?? ""}
                onChange={(e) => e.target.value && onSelectCharacter?.(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground focus:border-accent/50 focus:outline-none"
              >
                {activeCharacterId === null && (
                  <option value="" disabled>
                    选择角色
                  </option>
                )}
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onNewCharacter?.()}
                className="shrink-0 rounded-lg bg-foreground/5 px-2.5 text-xs text-foreground transition-colors duration-300 hover:bg-foreground/10"
              >
                新建
              </button>
            </div>

            {skills.length > 0 ? (
              <>
                <p className="text-[10px] text-muted">点击技能设为激活，用于下方快捷骰</p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <button
                      key={s.name}
                      onClick={() => setActiveSkill(s.name)}
                      className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-all duration-300 ${
                        activeSkill === s.name
                          ? "bg-accent text-accent-foreground"
                          : "bg-foreground/5 text-muted hover:text-foreground"
                      }`}
                    >
                      {s.name}
                      <span className="ml-1 font-mono opacity-70">{s.value}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => quickRoll(false)}
                    disabled={!activeSkill || !onSend}
                    className="flex-1 rounded-lg bg-accent px-2 py-1.5 text-xs font-medium text-accent-foreground transition-all duration-300 hover:-translate-y-0.5 hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    1d100
                  </button>
                  <button
                    type="button"
                    onClick={() => quickRoll(true)}
                    disabled={!activeSkill || !onSend}
                    className="flex-1 rounded-lg bg-foreground/10 px-2 py-1.5 text-xs font-medium text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-foreground/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    暗骰
                  </button>
                </div>
              </>
            ) : (
              <p className="text-[10px] text-muted">该角色暂无技能</p>
            )}
          </div>
        )}
      </section>
    </aside>
  );
}
