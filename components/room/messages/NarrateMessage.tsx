import type { Message } from "@/lib/types";

/** narrate（叙述）：KP 场景描述，低饱和暖色玻璃 */
export default function NarrateMessage({ message }: { message: Message }) {
  return (
    <div className="my-1 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
      <p className="italic leading-relaxed text-foreground">{message.content}</p>
      <span className="mt-1 block text-right text-[10px] text-muted">
        — 叙述 · {message.senderName}
      </span>
    </div>
  );
}
