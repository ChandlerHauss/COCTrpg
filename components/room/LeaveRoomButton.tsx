"use client";

import { leaveRoom } from "@/app/actions/room";

/** 退出房间：调用 leaveRoom 删除成员并跳回大厅。 */
export default function LeaveRoomButton({ roomId }: { roomId: string }) {
  return (
    <form action={leaveRoom.bind(null, roomId)}>
      <button
        type="submit"
        className="glass rounded-xl px-3 py-1.5 text-xs text-rose-600 transition-all duration-300 hover:bg-rose-500/10 dark:text-rose-300"
      >
        退出房间
      </button>
    </form>
  );
}
