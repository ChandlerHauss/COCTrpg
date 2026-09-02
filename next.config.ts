import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',    // ★ 生成独立 Node 运行包
};

export default nextConfig;
