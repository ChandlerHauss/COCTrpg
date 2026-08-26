import type { Message } from "@/lib/types";
import Avatar from "./Avatar";

/** npc（NPC）：低饱和暖色玻璃 + NPC 标签，KP 扮演 NPC 时使用 */
export default function NpcMessage({ message }: { message: Message }) {
  return (
    <div className="flex items-start gap-2.5">
      <Avatar url={message.senderAvatar} username={message.senderName} size="sm" />
      <div className="flex max-w-[75%] flex-col gap-1">
        <div className="rounded-2xl rounded-tl-md border border-amber-500/20 bg-amber-500/10 px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
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
