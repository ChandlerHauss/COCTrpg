"use client";

import { useState } from "react";
import type { SpeakAs, SpeakAsOption } from "@/lib/types";
import SpeakAsChips from "./SpeakAsChips";

export default function ChatInput({
  onSend,
  disabled = false,
  speakAsOptions = [],
  selectedKey = null,
  onSelectKey,
}: {
  onSend?: (content: string, as?: SpeakAs) => Promise<string | null>;
  disabled?: boolean;
  speakAsOptions?: SpeakAsOption[];
  selectedKey?: string | null;
  onSelectKey?: (key: string) => void;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  // 未选择时默认第一个（自己）
  const selected =
    speakAsOptions.find((o) => o.key === selectedKey) ?? speakAsOptions[0] ?? null;

  async function submit() {
    const trimmed = text.trim();
    if (!trimmed || !onSend) return;
    setError(null);
    const err = await onSend(trimmed, selected?.as);
    if (err) setError(err);
    else setText("");
  }

  return (
    <div className="glass-strong rounded-2xl p-3">
      {/* 身份选择器：以什么身份发送消息 */}
      {speakAsOptions.length > 0 && (
        <div className="mb-2">
          <SpeakAsChips
            options={speakAsOptions}
            selectedKey={selectedKey}
            onSelectKey={(key) => onSelectKey?.(key)}
          />
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // 中文输入法组词过程中不触发发送
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="输入消息，按 Enter 发送"
          className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted transition-shadow duration-300 ease-out focus:border-accent/50 focus:outline-none focus:ring-4 focus:ring-accent/20"
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-all duration-300 ease-out hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          发送
        </button>
      </div>
      {error && <p className="mt-1.5 text-[11px] text-red-600 dark:text-red-300">{error}</p>}
    </div>
  );
}
