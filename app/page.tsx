import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Avatar from "@/components/room/messages/Avatar";

// 首页需按请求读取登录态（而非静态预渲染）
export const dynamic = "force-dynamic";

export default async function Home() {
  const configured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  let user: { id: string } | null = null;
  let username: string | null = null;
  let avatarUrl: string | null = null;

  if (configured) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data.user;
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", user.id)
          .single();
        username = profile?.username ?? null;
        avatarUrl = profile?.avatar_url ?? null;
      }
    } catch {
      // 网络异常或配置有误时降级为未登录视图
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="glass-strong w-full max-w-md rounded-3xl p-10">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">COC 跑团平台</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          克苏鲁的呼唤 · 多人实时在线跑团房间系统
        </p>

        {user ? (
          <>
            <div className="mt-6 flex justify-center">
              <Avatar url={avatarUrl} username={username ?? "调查员"} size="lg" />
            </div>
            <p className="mt-3 text-sm text-foreground">欢迎回来，{username ?? "调查员"}</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link
                href="/lobby"
                className="inline-block rounded-2xl bg-accent px-6 py-3 font-medium text-accent-foreground transition-all duration-300 ease-out hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                进入大厅
              </Link>
              <Link
                href="/settings"
                className="glass inline-block rounded-2xl px-6 py-3 font-medium text-foreground transition-all duration-300 ease-out hover:bg-surface-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                设置
              </Link>
            </div>
          </>
        ) : (
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-block rounded-2xl bg-accent px-6 py-3 font-medium text-accent-foreground transition-all duration-300 ease-out hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              登录
            </Link>
            <Link
              href="/signup"
              className="glass inline-block rounded-2xl px-6 py-3 font-medium text-foreground transition-all duration-300 ease-out hover:bg-surface-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              注册
            </Link>
          </div>
        )}

        <p className="mt-6 text-xs text-muted">
          <Link href="/room" className="text-accent hover:underline">
            查看演示房间
          </Link>
          <span> · 三栏布局 · 6 种消息类型 · COC 7 版骰子判定</span>
        </p>
      </div>
    </main>
  );
}
