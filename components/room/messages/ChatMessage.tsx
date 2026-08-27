import type { Message } from "@/lib/types";
import Avatar from "./Avatar";

/** chat（对话）：玻璃气泡，普通文字 */
export default function ChatMessage({
  message,
  isMine,
}: {
  message: Message;
  isMine: boolean;
}) {
  return (
    <div className={`flex items-start gap-2.5 ${isMine ? "flex-row-reverse" : ""}`}>
      <Avatar url={message.senderAvatar} username={message.senderName} size="sm" />
      <div className={`flex max-w-[70%] flex-col gap-1 ${isMine ? "items-end" : ""}`}>
        <div className={`flex items-baseline gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
          <span className="text-xs font-semibold text-foreground">{message.senderName}</span>
          <span className="text-[10px] text-muted">{message.timestamp}</span>
        </div>
        <div
          className={`glass rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed text-foreground ${
            isMine ? "rounded-tr-md" : "rounded-tl-md"
          }`}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}
