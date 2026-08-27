export type BgMode = "room" | "personal";

// 无图片时回退的低饱和环境光（原型占位，便于肉眼区分「房间背景」与「个人背景」）
const ROOM_BG =
  "radial-gradient(ellipse at 18% 22%, rgba(99,102,241,0.16), transparent 55%), radial-gradient(ellipse at 82% 78%, rgba(14,165,233,0.14), transparent 55%)";

const PERSONAL_BG =
  "radial-gradient(ellipse at 72% 28%, rgba(168,130,255,0.18), transparent 55%), radial-gradient(ellipse at 28% 80%, rgba(56,189,248,0.16), transparent 60%)";

function imageStyle(url: string | null, opacity: number, blur: number, fallback: string) {
  if (url) {
    return {
      backgroundImage: `url(${url})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      opacity,
      filter: blur > 0 ? `blur(${blur}px)` : undefined,
    };
  }
  return { background: fallback, opacity };
}

/**
 * 聊天背景分层（从底到顶）：
 * 1. 主题底色（由父容器 / body 提供）
 * 2. 背景槽位：房间背景（透明度 roomBgOpacity + 模糊 roomBgBlur）或个人背景（覆盖房间，同层互斥）
 * 3. 消息气泡（z 更高，由内容区保证）
 */
export default function Background({
  mode,
  bgCustom,
  roomBgOpacity,
  roomBgBlur,
  personalBg,
  personalBgOpacity,
  personalBgBlur,
}: {
  mode: BgMode;
  bgCustom?: string | null;
  roomBgOpacity: number;
  roomBgBlur?: number;
  personalBg?: string | null;
  personalBgOpacity?: number;
  personalBgBlur?: number;
}) {
  const layer =
    mode === "personal"
      ? imageStyle(personalBg ?? null, personalBgOpacity ?? 1, personalBgBlur ?? 0, PERSONAL_BG)
      : imageStyle(bgCustom ?? null, roomBgOpacity, roomBgBlur ?? 0, ROOM_BG);

  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
      <div className="absolute inset-0" style={layer} />
    </div>
  );
}
