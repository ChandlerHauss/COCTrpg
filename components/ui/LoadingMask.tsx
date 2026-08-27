/** 全屏加载遮罩：玻璃拟态 + spinner，用于 route 级 loading 状态。 */
export default function LoadingMask() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm [animation:mask-in_0.25s_ease-out_0.2s_both]">
      <div className="glass-strong flex flex-col items-center gap-3 rounded-3xl px-8 py-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
        <p className="text-sm text-muted">加载中…</p>
      </div>
    </div>
  );
}
