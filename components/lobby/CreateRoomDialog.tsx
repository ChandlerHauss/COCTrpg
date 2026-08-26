"use client";

import { useActionState, useState } from "react";
import { createRoom, type RoomActionState } from "@/app/actions/room";

const inputCls =
  "w-full rounded-xl border border-border bg-surface/60 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/70 outline-none transition-all duration-300 ease-out focus:border-accent/50 focus:ring-4 focus:ring-accent/20";

export default function CreateRoomDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<RoomActionState, FormData>(
    createRoom,
    {}
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-all duration-300 ease-out hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        创建房间
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
            <h2 className="text-lg font-semibold text-foreground">创建房间</h2>
            <form action={formAction} className="mt-5 space-y-4">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-muted">
                  房间名
                </label>
                <input
                  id="name"
                  name="name"
                  className={inputCls}
                  placeholder="例如：暗雾镇侦探社"
                  required
                />
              </div>

              <div>
                <label htmlFor="maxPlayers" className="mb-1.5 block text-xs font-medium text-muted">
                  最大人数
                </label>
                <input
                  id="maxPlayers"
                  name="maxPlayers"
                  type="number"
                  min={2}
                  max={20}
                  defaultValue={5}
                  className={inputCls}
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
                  placeholder="留空表示无密码"
                  autoComplete="new-password"
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
                  {pending ? "创建中…" : "创建"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
