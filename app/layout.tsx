import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import LoadingBar from "@/components/ui/LoadingBar";

export const metadata: Metadata = {
  title: "COC 跑团平台",
  description: "克苏鲁的呼唤 · 多人实时在线跑团房间系统",
};

// 首次渲染前解析主题（本地存储优先，否则跟随系统），写入 data-theme 防止闪烁（FOUC）
const themeInitScript = `(function(){var t;try{t=localStorage.getItem('theme');}catch(e){t=null;}if(t!=='light'&&t!=='dark'){t=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';}document.documentElement.setAttribute('data-theme',t);})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="h-full">
        {children}
        <LoadingBar />
      </body>
    </html>
  );
}
