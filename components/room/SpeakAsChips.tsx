"use client";

import type { ReactNode } from "react";
import type { SpeakAsOption } from "@/lib/types";
import Avatar from "./messages/Avatar";

/** 发言身份 chip 行：聊天框与右侧快捷骰共用，保证两侧一致、同步 */
export default function SpeakAsChips({
  options,
  selectedKey,
  onSelectKey,
  trailing,
}: {
  options: SpeakAsOption[];
  selectedKey: string | null;
  onSelectKey: (key: string) => void;
  /** 末尾附加节点（如 DicePanel 的「+ 新建角色」按钮） */
  trailing?: ReactNode;
}) {
  // 未选择时默认第一个（自己）
  const selected = options.find((o) => o.key === selectedKey) ?? options[0] ?? null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = selected?.key === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onSelectKey(opt.key)}
            className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] transition-all duration-300 ${
              active
                ? "border-accent/40 bg-accent/15 text-foreground"
                : "border-border bg-foreground/5 text-muted hover:text-foreground"
            }`}
          >
            <Avatar url={opt.as.avatarUrl} username={opt.as.name} size="xs" />
            <span className="max-w-[120px] truncate">{opt.as.name}</span>
          </button>
        );
      })}
      {trailing}
    </div>
  );
}
