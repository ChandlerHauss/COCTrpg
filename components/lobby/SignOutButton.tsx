"use client";

import { signOut } from "@/app/actions/auth";

export default function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="glass rounded-xl px-4 py-2 text-sm text-muted transition-all duration-300 ease-out hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        退出登录
      </button>
    </form>
  );
}
