"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/** 顶部进度条：路由变化时扫过一条 accent 细条，给出「正在响应」的即时反馈。 */
export default function LoadingBar() {
  const pathname = usePathname();
  const first = useRef(true);
  const [active, setActive] = useState(false);

  useEffect(() => {
    // 跳过首帧（首屏加载由 loading.tsx 遮罩覆盖），只响应后续路由变化
    if (first.current) {
      first.current = false;
      return;
    }
    setActive(true);
    const t = setTimeout(() => setActive(false), 800);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden transition-opacity duration-300 ${
        active ? "opacity-100" : "opacity-0"
      }`}
    >
      {active && (
        <div className="h-full w-full animate-[loading-bar_0.8s_ease-in-out_infinite] bg-accent" />
      )}
    </div>
  );
}
