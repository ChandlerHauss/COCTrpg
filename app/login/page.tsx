import Link from "next/link";
import AuthForm from "@/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="glass-strong w-full max-w-sm rounded-3xl p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">登录</h1>
        <p className="mt-1.5 text-sm text-muted">欢迎回来，继续你的调查</p>
        <div className="mt-6">
          <AuthForm mode="login" />
        </div>
        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/" className="text-accent hover:underline">
            返回首页
          </Link>
        </p>
      </div>
    </main>
  );
}
