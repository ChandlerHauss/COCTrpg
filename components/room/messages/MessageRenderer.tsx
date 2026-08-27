import type { Message } from "@/lib/types";
import ChatMessage from "./ChatMessage";
import NarrateMessage from "./NarrateMessage";
import DiceMessage from "./DiceMessage";
import SystemMessage from "./SystemMessage";
import OocMessage from "./OocMessage";
import NpcMessage from "./NpcMessage";

export default function MessageRenderer({
  message,
  revealHidden,
  currentUserId,
}: {
  message: Message;
  revealHidden: boolean;
  currentUserId: string;
}) {
  // 自己的消息靠右（system 消息 senderId 为 null，恒靠左）
  const isMine = message.senderId != null && message.senderId === currentUserId;

  switch (message.type) {
    case "chat":
      return <ChatMessage message={message} isMine={isMine} />;
    case "narrate":
      return <NarrateMessage message={message} />;
    case "dice":
      return <DiceMessage message={message} revealHidden={revealHidden} isMine={isMine} />;
    case "system":
      return <SystemMessage message={message} />;
    case "ooc":
      return <OocMessage message={message} isMine={isMine} />;
    case "npc":
      return <NpcMessage message={message} isMine={isMine} />;
    default:
      return null;
  }
}
