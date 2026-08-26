import type { Message } from "@/lib/types";
import { ROLL_LEVEL_META } from "@/lib/dice";
import Avatar from "./Avatar";

/** dice（骰子）：玻璃气泡，显示骰子图标 + 点数 + 判定结果 + 颜色标识；支持暗骰 */
export default function DiceMessage({
  message,
  revealHidden,
}: {
  message: Message;
  revealHidden: boolean;
}) {
  const hidden = message.isHidden === true;

  // PL 视角下的暗骰：只显示占位提示
  if (hidden && !revealHidden) {
    return (
      <div className="flex items-start gap-2.5">
        <Avatar url={message.senderAvatar} username={message.senderName} size="sm" />
        <div className="glass rounded-2xl px-3.5 py-2.5 text-sm text-muted">
          🔒 守秘人进行了一次暗骰
        </div>
      </div>
    );
  }

  const meta = message.rollLevel ? ROLL_LEVEL_META[message.rollLevel] : null;

  return (
    <div className="flex items-start gap-2.5">
      <Avatar url={message.senderAvatar} username={message.senderName} size="sm" />
      <div className="flex max-w-[80%] flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold text-foreground">{message.senderName}</span>
          <span className="text-[10px] text-muted">{message.timestamp}</span>
          {hidden && (
            <span className="rounded bg-violet-500/15 px-1.5 py-px text-[10px] text-violet-600 dark:text-violet-300">
              暗骰
            </span>
          )}
        </div>
        <div className="glass rounded-2xl rounded-tl-md px-3.5 py-2.5 text-sm text-foreground">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎲</span>
            <span className="font-medium">{message.rollLabel ?? "掷骰"}</span>
            {message.rollTarget != null && message.rollResult != null ? (
              <span className="text-muted">
                {message.rollResult}
                <span className="opacity-70"> / {message.rollTarget}</span>
              </span>
            ) : (
              message.rollResult != null && (
                <span className="text-xl font-bold">{message.rollResult}</span>
              )
            )}
          </div>
          {meta && (
            <div className={`mt-1 text-sm font-semibold ${meta.textClass}`}>
              {meta.emoji} {meta.label}
            </div>
          )}
          {message.content && <p className="mt-1 text-muted">{message.content}</p>}
        </div>
      </div>
    </div>
  );
}
