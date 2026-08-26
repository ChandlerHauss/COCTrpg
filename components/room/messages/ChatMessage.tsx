import type { Message } from "@/lib/types";
import Avatar from "./Avatar";

/** chat（对话）：玻璃气泡，普通文字 */
export default function ChatMessage({ message }: { message: Message }) {
  return (
    <div className="flex items-start gap-2.5">
      <Avatar url={message.senderAvatar} username={message.senderName} size="sm" />
      <div className="flex max-w-[70%] flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold text-foreground">{message.senderName}</span>
          <span className="text-[10px] text-muted">{message.timestamp}</span>
        </div>
        <div className="glass rounded-2xl rounded-tl-md px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
          {message.content}
        </div>
      </div>
    </div>
  );
}
