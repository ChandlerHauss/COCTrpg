"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string };

/** 注册（邮箱 + 密码 + 昵称）。昵称写入 user_metadata，由 DB 触发器建 profile。 */
export async function signup(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const username = String(formData.get("username") ?? "").trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "请输入有效邮箱" };
  }
  if (password.length < 6) {
    return { error: "密码至少 6 位" };
  }
  if (!username) {
    return { error: "请填写昵称" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });

  if (error) return { error: error.message };
  redirect("/lobby");
}

/** 登录（邮箱 + 密码） */
export async function login(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: "邮箱或密码错误" };
  redirect("/lobby");
}

/** 退出登录 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
