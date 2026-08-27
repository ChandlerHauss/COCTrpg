"use client";

import { useEffect, useState } from "react";
import type { Character, SpeakAs, SpeakAsOption } from "@/lib/types";
import SpeakAsChips from "./SpeakAsChips";

export default function DicePanel({
  speakAsOptions,
  selectedKey,
  onSelectKey,
  characters,
  activeCharacterId,
  onNewCharacter,
  onSend,
}: {
  speakAsOptions: SpeakAsOption[];
  selectedKey: string | null;
  onSelectKey: (key: string) => void;
  characters: Character[];
  activeCharacterId: string | null;
  onNewCharacter?: () => void;
  onSend?: (input: string, as?: SpeakAs) => Promise<string | null>;
}) {
  const [activeSkill, setActiveSkill] = useState<string | null>(null);

  // 未选择时默认第一个（自己）
  const selectedAs =
    speakAsOptions.find((o) => o.key === selectedKey)?.as ?? speakAsOptions[0]?.as ?? null;
  const activeCharacter = characters.find((c) => c.id === activeCharacterId) ?? null;
  // 选「自己」时无 skills，回退到活跃角色技能
  const skills = selectedAs?.skills ?? activeCharacter?.skills ?? [];

  // 切换身份后清空激活技能，避免旧技能在新身份里不存在
  useEffect(() => setActiveSkill(null), [selectedKey]);

  function quickRoll(hidden: boolean) {
    if (!activeSkill || !onSend) return;
    onSend(`${hidden ? "/rh" : "/r"} ${activeSkill}`, selectedAs ?? undefined);
  }

  return (
    <aside className="glass flex h-full flex-col gap-4 overflow-y-auto rounded-3xl p-4">
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

      {/* 发言身份 + 技能快捷骰 */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">发言身份</h3>
        {speakAsOptions.length === 0 ? (
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
            <SpeakAsChips
              options={speakAsOptions}
              selectedKey={selectedKey}
              onSelectKey={onSelectKey}
              trailing={
                <button
                  type="button"
                  onClick={() => onNewCharacter?.()}
                  title="新建人物卡"
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-foreground/5 text-muted transition-colors duration-300 hover:bg-foreground/10 hover:text-foreground"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    aria-hidden
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              }
            />

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
              <p className="text-[10px] text-muted">该身份暂无技能</p>
            )}
          </div>
        )}
      </section>
    </aside>
  );
}
