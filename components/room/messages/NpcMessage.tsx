import type { Message } from "@/lib/types";
import Avatar from "./Avatar";

/** npc（NPC）：低饱和暖色玻璃 + NPC 标签，KP 扮演 NPC 时使用 */
export default function NpcMessage({
  message,
  isMine,
}: {
  message: Message;
  isMine: boolean;
}) {
  return (
    <div className={`flex items-start gap-2.5 ${isMine ? "flex-row-reverse" : ""}`}>
      <Avatar url={message.senderAvatar} username={message.senderName} size="sm" />
      <div className={`flex max-w-[75%] flex-col gap-1 ${isMine ? "items-end" : ""}`}>
        <div
          className={`rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-2.5 text-sm leading-relaxed text-foreground ${
            isMine ? "rounded-tr-md" : "rounded-tl-md"
          }`}
        >
          <div className="mb-0.5 flex items-center gap-2">
            <span className="rounded bg-amber-500/20 px-1.5 py-px text-[10px] font-bold tracking-wide text-amber-600 dark:text-amber-300">
              NPC
            </span>
            <span className="text-xs font-semibold text-foreground">{message.senderName}</span>
          </div>
          {message.content}
        </div>
      </div>
    </div>
  );
}
