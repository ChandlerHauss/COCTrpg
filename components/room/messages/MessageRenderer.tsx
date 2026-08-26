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
}: {
  message: Message;
  revealHidden: boolean;
}) {
  switch (message.type) {
    case "chat":
      return <ChatMessage message={message} />;
    case "narrate":
      return <NarrateMessage message={message} />;
    case "dice":
      return <DiceMessage message={message} revealHidden={revealHidden} />;
    case "system":
      return <SystemMessage message={message} />;
    case "ooc":
      return <OocMessage message={message} />;
    case "npc":
      return <NpcMessage message={message} />;
    default:
      return null;
  }
}
