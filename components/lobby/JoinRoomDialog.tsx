"use client";

import { useActionState, useState } from "react";
import { joinRoom, type RoomActionState } from "@/app/actions/room";

const inputCls =
  "w-full rounded-xl border border-border bg-surface/60 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/70 outline-none transition-all duration-300 ease-out focus:border-accent/50 focus:ring-4 focus:ring-accent/20";

export default function JoinRoomDialog({ defaultCode }: { defaultCode?: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<RoomActionState, FormData>(
    joinRoom,
    {}
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="glass rounded-xl px-4 py-2 text-sm text-foreground transition-all duration-300 ease-out hover:bg-surface-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        加入房间
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="glass-strong w-full max-w-sm rounded-3xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-foreground">加入房间</h2>
            <form action={formAction} className="mt-5 space-y-4">
              <div>
                <label htmlFor="code" className="mb-1.5 block text-xs font-medium text-muted">
                  房间号
                </label>
                <input
                  id="code"
                  name="code"
                  className={`${inputCls} font-mono uppercase`}
                  placeholder="例如：ABC123"
                  defaultValue={defaultCode ?? ""}
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-muted">
                  密码（可选）
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className={inputCls}
                  placeholder="无密码则留空"
                  autoComplete="current-password"
                />
              </div>

              {state.error && (
                <p className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-300">
                  {state.error}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="glass flex-1 rounded-xl py-2.5 text-sm text-muted transition-all duration-300 ease-out hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-medium text-accent-foreground transition-all duration-300 ease-out hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-60"
                >
                  {pending ? "加入中…" : "加入"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
