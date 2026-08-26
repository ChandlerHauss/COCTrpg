import type { Message } from "@/lib/types";

/** system（系统）：居中胶囊，小号字 */
export default function SystemMessage({ message }: { message: Message }) {
  return (
    <div className="my-0.5 flex justify-center">
      <div className="max-w-[90%] rounded-full bg-surface px-3.5 py-1.5 text-center text-xs text-muted">
        {message.content}
      </div>
    </div>
  );
}
