import RoomShell from "@/components/room/RoomShell";
import { room, members, currentUserId, messages } from "@/lib/mock";

// 演示房间：保留 Phase 1 静态原型，作为视觉参考
export default function RoomPage() {
  return (
    <RoomShell
      room={room}
      members={members}
      currentUserId={currentUserId}
      messages={messages}
    />
  );
}
