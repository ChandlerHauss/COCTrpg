"use client";

import { useActionState, useState } from "react";
import { deleteRoom, updateRoom, type RoomActionState } from "@/app/actions/room";
import type { Room } from "@/lib/types";
import type { BgMode } from "./Background";
import type { PersonalBg, RoomBg } from "@/hooks/useBackground";

const uploadBtnCls =
  "cursor-pointer rounded-lg bg-foreground/5 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors duration-300 hover:bg-foreground/10";

const inputCls =
  "w-full rounded-xl border border-border bg-surface/60 px-3 py-2 text-xs text-foreground placeholder:text-muted/70 outline-none transition-all duration-300 focus:border-accent/50 focus:ring-4 focus:ring-accent/20";

/** 左侧翻面设置面板（背面）：房间属性（KP）、暗骰可见性（KP）、聊天背景（全员）。 */
export default function RoomSettingsPanel({
  room,
  isKp,
  onClose,
  bgMode,
  setBgMode,
  kpView,
  setKpView,
  roomBg,
  personalBg,
  uploading,
  onSetRoomBgOpacity,
  onSetRoomBgBlur,
  onSetPersonalBgOpacity,
  onSetPersonalBgBlur,
  onUploadRoomBg,
  onClearRoomBg,
  onUploadPersonalBg,
  onClearPersonalBg,
}: {
  room: Room;
  isKp: boolean;
  onClose: () => void;
  bgMode: BgMode;
  setBgMode: (m: BgMode) => void;
  kpView: boolean;
  setKpView: (v: boolean) => void;
  roomBg: RoomBg;
  personalBg: PersonalBg;
  uploading?: null | "room" | "personal";
  onSetRoomBgOpacity?: (v: number) => void;
  onSetRoomBgBlur?: (v: number) => void;
  onSetPersonalBgOpacity?: (v: number) => void;
  onSetPersonalBgBlur?: (v: number) => void;
  onUploadRoomBg?: (file: File) => Promise<string | null>;
  onClearRoomBg?: () => void;
  onUploadPersonalBg?: (file: File) => Promise<string | null>;
  onClearPersonalBg?: () => void;
}) {
  const [state, formAction, pending] = useActionState<RoomActionState, FormData>(
    updateRoom,
    {}
  );
  const [bgError, setBgError] = useState<string | null>(null);

  async function onRoomFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onUploadRoomBg) return;
    setBgError(null);
    const err = await onUploadRoomBg(file);
    if (err) setBgError(err);
    e.target.value = "";
  }

  async function onPersonalFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onUploadPersonalBg) return;
    setBgError(null);
    const err = await onUploadPersonalBg(file);
    if (err) setBgError(err);
    e.target.value = "";
  }

  return (
    <aside className="glass flex h-full flex-col overflow-hidden rounded-3xl">
      {/* 头部 */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="text-sm font-semibold text-foreground">房间设置</h2>
        <button
          type="button"
          onClick={onClose}
          className="glass rounded-xl px-3 py-1.5 text-xs text-muted transition-all duration-300 hover:text-foreground"
        >
          ← 返回
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* 房间属性（仅 KP） */}
        {isKp && (
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              房间属性
            </h3>
            <form action={formAction} className="space-y-2.5">
              <input type="hidden" name="roomId" value={room.id} />
              <div>
                <label className="mb-1 block text-[10px] text-muted">房间名</label>
                <input
                  name="name"
                  type="text"
                  defaultValue={room.name}
                  className={inputCls}
                  placeholder="房间名"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-muted">最大人数（2–20）</label>
                <input
                  name="maxPlayers"
                  type="number"
                  min={2}
                  max={20}
                  defaultValue={room.maxPlayers}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-muted">
                  房间密码 {room.hasPassword ? "（当前已设）" : "（当前无密码）"}
                </label>
                <input
                  name="password"
                  type="password"
                  className={inputCls}
                  placeholder={room.hasPassword ? "输入新密码以修改" : "留空则无密码"}
                  autoComplete="new-password"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  name="passwordMode"
                  value="set"
                  disabled={pending}
                  className="flex-1 rounded-lg bg-accent px-2 py-1.5 text-xs font-medium text-accent-foreground transition-all duration-300 hover:opacity-90 disabled:opacity-60"
                >
                  {pending ? "保存中…" : "保存"}
                </button>
                {room.hasPassword && (
                  <button
                    type="submit"
                    name="passwordMode"
                    value="remove"
                    disabled={pending}
                    className="flex-1 rounded-lg bg-foreground/10 px-2 py-1.5 text-xs font-medium text-foreground transition-all duration-300 hover:bg-foreground/20 disabled:opacity-60"
                  >
                    移除密码
                  </button>
                )}
              </div>
              {state.error && (
                <p className="text-[10px] text-red-600 dark:text-red-300">{state.error}</p>
              )}
            </form>
          </section>
        )}

        {/* 暗骰可见性（仅 KP） */}
        {isKp && (
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              暗骰可见性
            </h3>
            <div className="flex rounded-xl bg-foreground/5 p-0.5 text-xs">
              {(
                [
                  { v: false, label: "PL 视角" },
                  { v: true, label: "KP 视角" },
                ] as const
              ).map((o) => (
                <button
                  key={String(o.v)}
                  onClick={() => setKpView(o.v)}
                  className={`flex-1 rounded-[10px] py-1.5 font-medium transition-all duration-300 ease-out ${
                    kpView === o.v
                      ? "bg-surface-strong text-foreground shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[10px] text-muted">暗骰结果仅 KP 可见，PL 看到占位提示</p>
          </section>
        )}

        {/* 聊天背景（全员） */}
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">聊天背景</h3>
          <div className="flex rounded-xl bg-foreground/5 p-0.5 text-xs">
            {(
              [
                { v: "room", label: "跟随房间" },
                { v: "personal", label: "个人背景" },
              ] as const
            ).map((o) => (
              <button
                key={o.v}
                onClick={() => setBgMode(o.v)}
                className={`flex-1 rounded-[10px] py-1.5 font-medium transition-all duration-300 ease-out ${
                  bgMode === o.v
                    ? "bg-surface-strong text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          {bgMode === "room" ? (
            <div className="mt-2 space-y-2.5">
              {isKp && onUploadRoomBg && (
                <div className="flex items-center gap-2">
                  <label className={uploadBtnCls}>
                    {uploading === "room" ? "上传中…" : "上传背景图"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onRoomFile}
                    />
                  </label>
                  {onClearRoomBg && (
                    <button
                      type="button"
                      onClick={onClearRoomBg}
                      className="text-xs text-muted hover:text-foreground"
                    >
                      移除
                    </button>
                  )}
                </div>
              )}
              {onSetRoomBgOpacity && (
                <label className="block">
                  <div className="flex items-center justify-between text-[10px] text-muted">
                    <span>透明度（本人视角）</span>
                    <span className="font-mono">{Math.round(roomBg.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={roomBg.opacity}
                    onChange={(e) => onSetRoomBgOpacity(Number(e.target.value))}
                    className="w-full accent-[var(--accent)]"
                  />
                </label>
              )}
              {onSetRoomBgBlur && (
                <label className="block">
                  <div className="flex items-center justify-between text-[10px] text-muted">
                    <span>模糊度（本人视角）</span>
                    <span className="font-mono">{roomBg.blur}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    step={1}
                    value={roomBg.blur}
                    onChange={(e) => onSetRoomBgBlur(Number(e.target.value))}
                    className="w-full accent-[var(--accent)]"
                  />
                </label>
              )}
            </div>
          ) : (
            <div className="mt-2 space-y-2.5">
              {onUploadPersonalBg && (
                <div className="flex items-center gap-2">
                  <label className={uploadBtnCls}>
                    {uploading === "personal" ? "上传中…" : "上传个人背景"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onPersonalFile}
                    />
                  </label>
                  {onClearPersonalBg && (
                    <button
                      type="button"
                      onClick={onClearPersonalBg}
                      className="text-xs text-muted hover:text-foreground"
                    >
                      移除
                    </button>
                  )}
                </div>
              )}
              {onSetPersonalBgOpacity && (
                <label className="block">
                  <div className="flex items-center justify-between text-[10px] text-muted">
                    <span>透明度</span>
                    <span className="font-mono">{Math.round(personalBg.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={personalBg.opacity}
                    onChange={(e) => onSetPersonalBgOpacity(Number(e.target.value))}
                    className="w-full accent-[var(--accent)]"
                  />
                </label>
              )}
              {onSetPersonalBgBlur && (
                <label className="block">
                  <div className="flex items-center justify-between text-[10px] text-muted">
                    <span>模糊度</span>
                    <span className="font-mono">{personalBg.blur}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    step={1}
                    value={personalBg.blur}
                    onChange={(e) => onSetPersonalBgBlur(Number(e.target.value))}
                    className="w-full accent-[var(--accent)]"
                  />
                </label>
              )}
              <p className="text-[10px] text-muted">个人背景覆盖房间背景，仅自己可见，可切回</p>
            </div>
          )}

          {bgError && (
            <p className="mt-1.5 text-[10px] text-red-600 dark:text-red-300">{bgError}</p>
          )}
        </section>

        {/* 危险区（仅 KP，置于最底部防误触） */}
        {isKp && (
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              危险区
            </h3>
            <form action={deleteRoom.bind(null, room.id)}>
              <button
                type="submit"
                onClick={(e) => {
                  if (!window.confirm("确定解散房间？此操作不可撤销，所有成员与聊天记录将被清除。")) {
                    e.preventDefault();
                  }
                }}
                className="w-full rounded-lg bg-red-600/90 px-3 py-2 text-xs font-medium text-white transition-all duration-300 hover:bg-red-600"
              >
                解散房间
              </button>
            </form>
          </section>
        )}
      </div>
    </aside>
  );
}
