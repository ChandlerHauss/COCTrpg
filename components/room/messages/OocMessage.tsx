import type { Message } from "@/lib/types";

/** ooc（场外）：玻璃框，带 OOC 标签 */
export default function OocMessage({
  message,
  isMine,
}: {
  message: Message;
  isMine: boolean;
}) {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[75%] rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-muted">
        <div className="mb-0.5 flex items-center gap-2">
          <span className="rounded bg-foreground/10 px-1.5 py-px text-[10px] font-bold tracking-wide text-muted">
            OOC
          </span>
          <span className="text-xs text-muted">{message.senderName}</span>
        </div>
        {message.content}
      </div>
    </div>
  );
}
