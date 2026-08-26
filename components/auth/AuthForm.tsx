"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup, type AuthState } from "@/app/actions/auth";

const inputCls =
  "w-full rounded-xl border border-border bg-surface/60 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/70 outline-none transition-all duration-300 ease-out focus:border-accent/50 focus:ring-4 focus:ring-accent/20";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "signup" ? signup : login;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    {}
  );

  return (
    <form action={formAction} className="space-y-4">
      {mode === "signup" && (
        <div>
          <label htmlFor="username" className="mb-1.5 block text-xs font-medium text-muted">
            昵称
          </label>
          <input
            id="username"
            name="username"
            className={inputCls}
            placeholder="跑团显示名"
            autoComplete="username"
            required
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-muted">
          邮箱
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className={inputCls}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-muted">
          密码
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className={inputCls}
          placeholder={mode === "signup" ? "至少 6 位" : "输入密码"}
          minLength={6}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
        />
      </div>

      {state.error && (
        <p className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-accent py-3 font-medium text-accent-foreground transition-all duration-300 ease-out hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-60"
      >
        {pending ? "处理中…" : mode === "signup" ? "注册" : "登录"}
      </button>

      <p className="text-center text-xs text-muted">
        {mode === "signup" ? "已有账号？" : "还没有账号？"}{" "}
        <Link
          href={mode === "signup" ? "/login" : "/signup"}
          className="text-accent hover:underline"
        >
          {mode === "signup" ? "去登录" : "去注册"}
        </Link>
      </p>
    </form>
  );
}
