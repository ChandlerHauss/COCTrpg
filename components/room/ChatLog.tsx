"use client";

import { useState } from "react";
import type { ConnectionStatus, Message, Room } from "@/lib/types";
import Background, { type BgMode } from "./Background";
import MessageRenderer from "./messages/MessageRenderer";
import ChatInput from "./ChatInput";
import ThemeToggle from "@/components/ThemeToggle";

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  waiting: { text: "等待中", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-300" },
  running: { text: "进行中", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" },
  paused: { text: "暂停", cls: "bg-foreground/10 text-muted" },
  archived: { text: "已归档", cls: "bg-foreground/10 text-muted" },
};

const CONN_DOT: Record<ConnectionStatus, { dot: string; text: string }> = {
  connecting: { dot: "bg-amber-400", text: "连接中…" },
  connected: { dot: "bg-emerald-400", text: "在线" },
  disconnected: { dot: "bg-rose-400", text: "重连中…" },
};

export default function ChatLog({
  roomName,
  roomStatus,
  messages,
  revealHidden,
  bgMode,
  bgOpacity,
  onSend,
  connectionStatus = "connected",
}: {
  roomName: string;
  roomStatus: Room["status"];
  messages: Message[];
  revealHidden: boolean;
  bgMode: BgMode;
  bgOpacity: number;
  onSend?: (content: string) => void;
  connectionStatus?: ConnectionStatus;
}) {
  const [scrolled, setScrolled] = useState(false);
  const status = STATUS_LABEL[roomStatus] ?? STATUS_LABEL.running;
  const conn = CONN_DOT[connectionStatus] ?? CONN_DOT.connected;

  return (
    <main className="glass relative flex h-full min-w-0 flex-col overflow-hidden rounded-3xl">
      <Background mode={bgMode} bgOpacity={bgOpacity} />

      {/* 顶部液态导航栏：滚动时收缩 + 增强磨砂 */}
      <header
        className={`relative z-20 flex items-center justify-between gap-3 px-4 backdrop-blur-lg transition-all duration-300 ease-out ${
          scrolled ? "border-b border-border bg-surface py-2" : "py-3"
        }`}
      >
        <h1 className="truncate text-sm font-semibold text-foreground">{roomName}</h1>
        <div className="flex shrink-0 items-center gap-2">
          <span
            title={conn.text}
            className="flex items-center gap-1.5 rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] text-muted"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${conn.dot}`} />
            {conn.text}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] ${status.cls}`}>
            {status.text}
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* 消息流（内容优先，居中阅读宽度） */}
      <div
        className="relative z-10 flex-1 overflow-y-auto px-4 py-4"
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 0)}
      >
        {messages.length > 0 ? (
          <div className="mx-auto flex max-w-2xl flex-col gap-3">
            {messages.map((m) => (
              <MessageRenderer key={m.id} message={m} revealHidden={revealHidden} />
            ))}
          </div>
        ) : (
          <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center text-center text-sm text-muted">
            {connectionStatus === "connecting" ? "正在连接房间…" : "暂无消息"}
          </div>
        )}
      </div>

      {/* 输入框（悬浮玻璃） */}
      <div className="relative z-20 px-4 pb-4">
        <ChatInput
          onSend={onSend}
          disabled={!onSend || connectionStatus !== "connected"}
        />
      </div>
    </main>
  );
}
