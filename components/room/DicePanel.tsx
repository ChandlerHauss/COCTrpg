import type { Character } from "@/lib/types";
import type { BgMode } from "./Background";

function StatBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px] text-muted">
        <span>{label}</span>
        <span className="font-mono">
          {value}/{max}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function DicePanel({
  bgMode,
  setBgMode,
  kpView,
  setKpView,
  currentCharacter,
}: {
  bgMode: BgMode;
  setBgMode: (m: BgMode) => void;
  kpView: boolean;
  setKpView: (v: boolean) => void;
  currentCharacter: Character | null;
}) {
  return (
    <aside className="glass flex h-full flex-col gap-4 overflow-y-auto rounded-3xl p-4">
      {/* 暗骰可见性 */}
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
            <code className="text-accent">/r 1d6+db</code> 伤害掷骰
          </li>
          <li>
            <code className="text-accent">/rh 潜行</code> 暗骰
          </li>
          <li>
            <code className="text-accent">/r 1d100/2</code> 困难检定
          </li>
        </ul>
      </section>

      {/* 当前角色状态 */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          当前角色{currentCharacter ? ` · ${currentCharacter.name}` : ""}
        </h3>
        {currentCharacter ? (
          <div className="space-y-2">
            <StatBar
              label="HP 生命"
              value={currentCharacter.hp}
              max={currentCharacter.hpMax}
              color="bg-red-500"
            />
            <StatBar
              label="SAN 理智"
              value={currentCharacter.san}
              max={currentCharacter.sanMax}
              color="bg-sky-500"
            />
            <StatBar
              label="MP 魔法"
              value={currentCharacter.mp}
              max={currentCharacter.mpMax}
              color="bg-violet-500"
            />
          </div>
        ) : (
          <p className="text-[10px] text-muted">人物卡将在 Phase 3 支持</p>
        )}
      </section>
    </aside>
  );
}
