export type BgMode = "room" | "personal";

// 真实数据下这里是图片 URL（rooms.bg_custom / room_members.bg_personal），
// 原型阶段用两组低饱和环境光模拟，便于肉眼区分「房间背景」与「个人背景」。
const ROOM_BG =
  "radial-gradient(ellipse at 18% 22%, rgba(99,102,241,0.16), transparent 55%), radial-gradient(ellipse at 82% 78%, rgba(14,165,233,0.14), transparent 55%)";

const PERSONAL_BG =
  "radial-gradient(ellipse at 72% 28%, rgba(168,130,255,0.18), transparent 55%), radial-gradient(ellipse at 28% 80%, rgba(56,189,248,0.16), transparent 60%)";

/**
 * 聊天背景分层（从底到顶）：
 * 1. 主题底色（由父容器 / body 提供）
 * 2. 背景槽位：房间背景（透明度 bgOpacity）或个人背景（覆盖房间，同层互斥）
 * 3. 消息气泡（z 更高，由内容区保证）
 */
export default function Background({
  mode,
  bgOpacity,
}: {
  mode: BgMode;
  bgOpacity: number;
}) {
  const layer =
    mode === "personal"
      ? { background: PERSONAL_BG, opacity: 1 }
      : { background: ROOM_BG, opacity: bgOpacity };

  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
      <div className="absolute inset-0" style={layer} />
    </div>
  );
}
