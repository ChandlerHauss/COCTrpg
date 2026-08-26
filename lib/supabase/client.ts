import { createBrowserClient } from "@supabase/ssr";

/**
 * 浏览器端 Supabase 客户端（客户端组件用）。
 * Phase 2 认证/房间都在服务端完成，此文件为 Phase 3 实时通信与后续客户端读会话预留。
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
