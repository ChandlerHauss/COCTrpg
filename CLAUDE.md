# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

COC 跑团平台（克苏鲁的呼唤 · Call of Cthulhu TRPG）—— 多人实时在线跑团房间系统。Next.js 16 App Router + Supabase（Auth / PostgREST / Realtime），UI 为自研「Liquid Glass」玻璃拟态设计系统。

## Commands

- `npm run dev` — 开发服务器（Turbopack）
- `npm run build` — 生产构建（含 TypeScript 检查，**唯一的类型检查关卡**）
- `npm start` — 启动生产构建
- `npm run lint` — ESLint（`eslint`，无额外脚本）

无测试套件、无测试运行器。改动后跑 `npm run build` 验证 TS 干净。

## Environment

- 需 `.env.local`（未提交）：`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`（新版 publishable key `sb_publishable_...` 即旧 anon key）。
- 缺这两项时 `proxy.ts` 的会话刷新自动跳过，演示页仍可跑。
- 数据库表**不由代码自动创建** —— `supabase/schema.sql` 是给用户在 Supabase SQL Editor 手动执行的建表/迁移脚本（按 Phase 分段）。增量改动**只跑增量段**；整段重跑会因 `create policy` 无 `if not exists` 报 "policy already exists"。

## Next.js 16 breaking changes（本项目实际用到）

- `middleware.ts` → **`proxy.ts`**（根目录，导出 `proxy` + `config.matcher`），会话刷新逻辑在 `lib/supabase/proxy.ts`。
- `cookies()` / `headers()` 是 **async** —— 用 `await cookies()`。
- 动态路由 `params` 是 **Promise** —— 见 `app/room/[id]/page.tsx` 的 `const { id } = await params`。
- 更多见 `node_modules/next/dist/docs/`（AGENTS.md 已警告）。

## Architecture

**技术栈**：Next.js 16.3.2（App Router / Turbopack）、React 19、TypeScript strict、Tailwind CSS v4（CSS-first）、`@supabase/supabase-js` + `@supabase/ssr`。路径别名 `@/*` → 项目根。

**Supabase 客户端**：
- 服务端 `lib/supabase/server.ts` 的 `createClient()`（async，`await cookies()`）—— Server Components / Server Actions 用。
- 浏览器 `lib/supabase/client.ts` 的 `createClient()`（`createBrowserClient`）—— 客户端组件 / Realtime 用。
- 会话刷新 + 路由守卫：根 `proxy.ts` → `lib/supabase/proxy.ts` 的 `updateSession`；受保护路由 `/lobby`、`/room/*`。

**Server Actions**（`"use server"`，均返回 `{ error?: string }` + `redirect`）：
- `app/actions/auth.ts` — signup/login/signOut。注册昵称写入 `user_metadata`，由 DB 触发器 `handle_new_user` 建 `profiles` 行。
- `app/actions/room.ts` — createRoom/joinRoom/leaveRoom。房主以 `kp` 入房，其他 `pl`。房间密码 scrypt 加盐哈希（`lib/password.ts`），房间号去歧义生成（`lib/room-code.ts`）。

**实时聊天 + 骰子（核心）**：
- `hooks/useRoomRealtime.ts` — 订阅房间 `messages` 表 Realtime INSERT（`postgres_changes`）+ Presence（在线状态）；`SUBSCRIBED`（含自动重连）时拉最近 100 条历史 + 上报 presence。`sendMessage` 是统一入口：自动识别骰子指令与普通聊天，返回 `Promise<string|null>`（null=成功、string=错误信息）。
- `hooks/useCharacters.ts` — 最小人物卡 CRUD + 本房活跃角色切换（`room_members.active_character_id`）。
- 骰子引擎 `lib/dice.ts` — `rollD100`、`parseDiceCommand`（skill/target/raw 三类）、`findSkillValue`、`judgeRoll`（COC 7：1-5 大成功、96-100 大失败优先，再极难/困难/成功/失败）、`ROLL_LEVEL_META`。

**页面 / 组件分层**：
- 真实房间：`app/room/[id]/page.tsx`（Server Component 取数）→ `components/room/LiveRoom.tsx`（客户端接 hooks）→ `RoomShell.tsx`（纯展示，props 透传）。
- 演示房间：`app/room/page.tsx` 直接用 `RoomShell` + `lib/mock.ts` 静态数据（Phase 1 视觉原型，无后端）。`RoomShell` 的所有实时/角色 props 均可选，故演示页不受影响。
- 消息渲染按 `message.type` 分派：`components/room/messages/MessageRenderer.tsx` → Chat/Narrate/Dice/System/Ooc/Npc。暗骰：`DiceMessage` 依 `isHidden && !revealHidden` 显示占位；`revealHidden`（=kpView）由 `RoomShell` 持有，初值 = `isKp`。
- 右侧 `DicePanel`：暗骰可见性（仅 KP）、聊天背景、骰子指令帮助、我的角色 + 技能快捷骰。
- 类型集中在 `lib/types.ts`（`Role`/`Message`/`Room`/`RoomMember`/`Skill`/`Character`/`CharacterCard` 等）。

**设计系统（Liquid Glass）**：`app/globals.css` 用 Tailwind v4 `@theme inline` 把 CSS 变量暴露为工具类（`text-foreground`/`text-muted`/`bg-surface`/`bg-surface-strong`/`border-border`/`bg-accent`/`ring-accent`/`text-accent-foreground`）+ 玻璃类 `.glass`/`.glass-strong`。深浅主题由 `@custom-variant dark` 跟随 `data-theme` 属性（非 prefers-color-scheme）；`app/layout.tsx` 内联脚本首渲染前写 `data-theme` 防 FOUC。
