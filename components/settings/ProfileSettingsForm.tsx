"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadImage, MAX_AVATAR_BYTES } from "@/lib/storage";
import Avatar from "@/components/room/messages/Avatar";

/** 用户设置：头像上传（写入 profiles.avatar_url，RLS 限本人）。用户名只读展示。 */
export default function ProfileSettingsForm({
  userId,
  username,
  avatarUrl: initialAvatarUrl,
}: {
  userId: string;
  username: string;
  avatarUrl: string | null;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    const url = await uploadImage(supabase, {
      bucket: "avatars",
      folder: userId,
      file,
      maxBytes: MAX_AVATAR_BYTES,
    });
    if (!url) {
      setBusy(false);
      setError("上传失败，请选择图片文件且不超过 2MB");
      return;
    }
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: url })
      .eq("id", userId);
    setBusy(false);
    if (updateError) {
      console.error("头像保存失败", updateError.message);
      setError("保存失败，请重试");
      return;
    }
    setAvatarUrl(url);
    setMessage("头像已更新");
  }

  async function onRemove() {
    setBusy(true);
    setError(null);
    setMessage(null);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", userId);
    setBusy(false);
    if (updateError) {
      console.error("移除头像失败", updateError.message);
      setError("移除失败，请重试");
      return;
    }
    setAvatarUrl(null);
    setMessage("头像已移除");
  }

  return (
    <div className="glass-strong rounded-3xl p-6">
      <div className="flex items-center gap-4">
        <Avatar url={avatarUrl} username={username} size="lg" />
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">{username}</span>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer rounded-xl bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground transition-all duration-300 hover:opacity-90">
              {busy ? "上传中…" : avatarUrl ? "更换头像" : "上传头像"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={busy}
                onChange={onFile}
              />
            </label>
            {avatarUrl && (
              <button
                type="button"
                onClick={onRemove}
                disabled={busy}
                className="rounded-xl bg-foreground/5 px-3 py-1.5 text-xs text-foreground transition-colors duration-300 hover:bg-foreground/10 disabled:opacity-40"
              >
                移除头像
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-red-600 dark:text-red-300">{error}</p>}
      {message && <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-300">{message}</p>}
    </div>
  );
}
