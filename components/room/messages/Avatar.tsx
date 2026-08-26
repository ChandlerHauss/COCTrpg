import { defaultAvatar } from "@/lib/avatar";

const SIZE_CLASS = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
} as const;

export default function Avatar({
  url,
  username,
  size = "md",
}: {
  url: string | null;
  username: string;
  size?: keyof typeof SIZE_CLASS;
}) {
  const ring = "ring-1 ring-border/60";

  if (url) {
    return (
      <img
        src={url}
        alt={username}
        className={`${SIZE_CLASS[size]} shrink-0 rounded-full object-cover ${ring}`}
      />
    );
  }

  const { initial, color } = defaultAvatar(username);
  return (
    <div
      className={`${SIZE_CLASS[size]} flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${color} ${ring}`}
    >
      {initial}
    </div>
  );
}
