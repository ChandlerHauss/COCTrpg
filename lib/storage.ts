import type { SupabaseClient } from "@supabase/supabase-js";

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const MAX_BG_BYTES = 5 * 1024 * 1024;

/**
 * 校验 + 上传图片到指定存储桶的 `{folder}/{uuid}.{ext}`，返回 publicUrl；失败返回 null。
 * RLS 要求桶内第一级目录 = 当前用户 id，因此 `folder` 始终传当前用户 id。
 */
export async function uploadImage(
  supabase: SupabaseClient,
  opts: {
    bucket: string;
    folder: string;
    file: File;
    maxBytes?: number;
  }
): Promise<string | null> {
  const { bucket, folder, file, maxBytes = MAX_AVATAR_BYTES } = opts;

  if (!file.type.startsWith("image/")) return null;
  if (file.size > maxBytes) return null;

  const ext = file.name.split(".").pop() || "png";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: false });
  if (error) {
    console.error("图片上传失败", error.message);
    return null;
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
