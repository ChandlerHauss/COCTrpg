import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileSettingsForm from "@/components/settings/ProfileSettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">用户设置</h1>
          <p className="mt-1 text-sm text-muted">头像会在登录主界面与房间成员列表中显示</p>
        </div>
        <Link
          href="/lobby"
          className="glass rounded-xl px-4 py-2 text-sm font-medium text-foreground transition-all duration-300 hover:bg-surface-strong"
        >
          返回大厅
        </Link>
      </header>

      <div className="mt-8">
        <ProfileSettingsForm
          userId={user.id}
          username={profile?.username ?? "调查员"}
          avatarUrl={profile?.avatar_url ?? null}
        />
      </div>
    </main>
  );
}
