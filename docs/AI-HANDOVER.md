# AI 交接文档 — UEG 联合地球政府门户站

> 本文档写给后续接手开发的 AI（或人类）。目标：读完即可独立开发，不踩前人踩过的坑。
> 基础仓库：**flare-stack-blog**（上游 `du2333/flare-stack-blog`，本仓库是 fork `murongruolan/flare-stack-blog`，远端 push 地址以 `git remote -v` 为准）。
> 本 fork 的用途：不是博客，而是「流浪地球」设定下 **UEG 联合地球政府** 的官方门户站（UEG Portal），保留了上游完整的 CMS 后台作为内容管理端。
> 文档落笔时间：2026-10-07。所有「当前」均指该时点。

---

## 1. 项目一句话与当前状态

- **是什么**：Cloudflare Workers 全 Serverless CMS（TanStack Start + D1/R2/KV/Queues），被深度改造为 UEG 主题政府门户：公开面是 UEG 视觉的门户页（首页/新闻/政策/机构/发动机浏览器/地下城等），后台管理面（`/admin`）基本保留上游 Fuwari 风格 CMS。
- **代码版本**：`package.json` version 3.0.0（基于上游 v3.0.0 基线，**上游已发布 3.2.0，未合并**，见 §12）。
- **开发分支**：`developer`（本地 + origin）。**main 停留在重构前基线 fe31d15d，永远不要动 main**（用户明确指令，见 §6）。
- **数据库迁移**：已到 `0027_category_streams.sql`；**生产库还没跑 0026/0027**，用户部署时要跑 `db:migrate`。
- **dev 服务**：常以 ZCode 后台任务方式跑在 3000 端口，日志在仓库根 `dev-server.log`（已 gitignore）。

---

## 2. 技术栈全景

| 层 | 技术 | 备注 |
|---|---|---|
| 全栈框架 | TanStack Start（React 19）+ TanStack Router 文件路由 | SSR + SPA 混合，路由树生成到 `src/routeTree.gen.ts` |
| API | orpc（contract + procedure + tanstack-query 集成） | 合约 JSON 生成到 `src/lib/orpc/contract.generated.json` |
| 运行时 | Cloudflare Workers（workerd），Vite + `@cloudflare/vite-plugin` | 本地 dev 即真 workerd，不是 miniflare 模拟层 |
| 数据库 | D1（SQLite）+ drizzle-orm + drizzle-zod | 迁移手写 SQL 在 `migrations/` |
| 对象存储 | R2 | 媒体库、发动机数据/模型，经 `/images/<key>` 路由透出 |
| 缓存 | KV（public-cache 条目缓存）+ Workers Cache API（CDN-Cache-Control） | 两层，见 §8.4 |
| 异步 | Queues（通知投递）+ Durable Objects（RateLimiter、PostPublisher） | 见 §8.7 |
| 认证 | better-auth 1.7.6 + GitHub OAuth | 第一个注册用户自动 admin |
| 编辑器 | TipTap 3（文章/评论共用基础件） | 自定义代码块 shiki 高亮、公式 katex |
| 样式 | Tailwind CSS 4 + 手写 CSS 文件（`src/styles/ueg-*.css`） | 字号令牌化，见 §9.8 |
| i18n | @inlang/paraglide-js，`messages/zh.json` + `messages/en.json` | 编译产物 `src/paraglide/`（gitignore，勿手改） |
| 包管理/工具链 | bun + oxlint + oxfmt + tsc（ts go 版 typescript@7）+ vitest + husky | `cf` CLI 1.0.0-beta.5（带 patch），替代 wrangler 的日常操作 |
| 3D/地图 | three.js 0.186 + maplibre-gl 6 | /engines 页，见 §9.6 |

**必须知道的工具链事实**：
- `cloudflare.config.ts`（不是 wrangler.jsonc！）才是真正的 Worker 配置（vite 插件 `experimental.newConfig` 读取）。它由 **Node ≥ 22.18** 加载——nvm 默认的 22.14 会报 "cloudflare.config.ts loading requires Node.js v22.18.0 or higher"。本机 F:\nvm 里用 **v24.9.0**。
- `wrangler.jsonc` 只剩 name/main/compatibility_date/observability，别在里面找绑定。
- `cf` CLI（`bunx cf`）是 2026 beta，替代了 wrangler 的大部分日常命令；找命令用 `bunx cf cli search "<task>"`。`cf d1 query` **没有本地等价命令**。

---

## 3. 架构总览（数据怎么流）

1. **请求** → TanStack Start SSR（Worker `App` export，`src/server.ts` 入口）→ 文件路由 `src/routes/**`。
2. **公开页数据**：路由 loader 里 `queryClient.ensureQueryData(queryOptions)` 预热 → orpc client → `/api/*` → orpc router（`src/features/*/server/router.ts`）→ service 层。
3. **service 层先查 Public Cache**（`src/features/cache/public-cache.ts` 的 `defineEntry`，条目存 KV，TTL 最长 7 天），miss 才落 data 层（`src/features/*/data/*.data.ts`，drizzle 查 D1）。
4. **失效**：后台写操作发事件（`post.published`、`category.changed` 等）→ `defineEntry` 声明的 `invalidatedBy` 匹配 → 删 KV 键。**直改数据库不会触发失效**（见 §10 的坑）。
5. **HTTP 缓存**：`src/lib/constants.ts` 的 `CACHE_CONTROL` 统一 CDN-Cache-Control 策略（public 1h、immutable 1 年给 .glb/.geojson 等、private no-store 给后台）。
6. **写路径**：后台 → adminProcedure（better-auth session 校验）→ service → D1 → 事件 → 邮件/邮件模板（react-email）与 webhook 经 Queue 异步投递。
7. **限流**：Durable Object `RateLimiter`（sqlite storage）；**定时任务** 每天 00:15（`15 0 * * *`）触发文章发布检查与 popularity 同步。

---

## 4. 快速上手（新会话第一件事照这个来）

```bash
# 1. node 版本（必须！否则 dev/typecheck 全挂）
export PATH="/f/nvm/nvm/v24.9.0:$PATH"

# 2. 启动 dev（当前约定为后台任务，日志追加到 dev-server.log）
(bun run dev >> dev-server.log 2>&1 &)
#    或者前台跑：bun run dev   （vite dev --port 3000）

# 3. 验证
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/organization   # 200

# 4. 后台
#   http://localhost:3000/admin → GitHub OAuth 登录（.dev.vars 已配 GITHUB_CLIENT_ID/SECRET）
#   第一个注册/登录的用户自动成为 admin；/register 被邮箱配置门控（未配 SMTP 时不可用）
```

常用命令（`package.json` scripts）：

| 命令 | 作用 |
|---|---|
| `bun run dev` | dev 服务器（3000 端口） |
| `bun test` | vitest 全量（workerd 集成测试） |
| `bun run lint` | oxlint（pre-commit 钩子跑的就是它） |
| `bun run typecheck` | orpc:contract + cf workers types + tsc --noEmit（pre-push 钩子） |
| `bun run orpc:contract` | 重新生成 orpc 合约 JSON（改了任何 router/schema 后） |
| `bun run db:migrate:local` | 本地 D1 应用迁移（固定 UUID `00000000-0000-4000-8000-000000000000`） |
| `bun run db:migrate` | 生产 D1 应用迁移（需 `$D1_DATABASE_ID` 环境变量） |
| `bun run i18n:compile` | 重编 paraglide 消息（改 messages/*.json 后；orpc:contract 也会先跑它） |
| `bun run check` | lint + format check + typecheck 全家桶 |
| `bun run build` / `bun run deploy` | 生产构建 / 部署 |

---

## 5. Git 工作流与提交推送规范

- **分支铁律（用户明确指令）**：所有开发只在 `developer` 分支做，提交、推送都在它；**永远不切回 main、不往 main push、不发 main 的 PR**。main 是用户手里的"上游对齐基线"。
- **husky 钩子**：
  - `pre-commit` → `bun lint`（oxlint）。
  - `pre-push` → `bun run typecheck`（orpc:contract + `bunx cf workers types` + tsc）。**push 前必须 `export PATH="/f/nvm/nvm/v24.9.0:$PATH"`**，否则钩子因 node 版本失败（报 "cloudflare.config.ts loading requires Node.js v22.18.0"）。
  - typecheck 脚本里必须是 `bunx cf workers types && tsc --noEmit`——历史上 `cf` 执行后同一命令链里 `./相对路径` 形式的 tsc 会 "command not found"（bun 的 bug），**别改回相对路径写法**。
- **commit message**：conventional 风格小写英文， scope 按模块，如 `fix(organization): tighten chart card min-height to 90px`、`feat: content streams become admin-CRUD-able (内容归属)`。小改动直接一个 commit，一次说清做了什么。
- **生成物不要手改、不要惊讶**：`src/routeTree.gen.ts`（路由树）、`src/lib/orpc/contract.generated.json`（orpc 合约）、`src/paraglide/**`（i18n 编译产物）、`.cloudflare/types/index.d.ts`（cf workers types）都是工具生成的，跑对应命令刷新即可。
- **push URL**：`https://github.com/murongruolan/flare-stack-blog.git`，分支 `developer`。

---

## 6. 目录与文件逐层讲解

### 6.1 仓库根

| 文件/目录 | 用途 |
|---|---|
| `AGENTS.md` | AI 工程配置入口：指向 `.scratch/` issue tracker、triage 标签、domain docs 规则 |
| `CLAUDE.md` | 只有一行：读 AGENTS.md |
| `CONTEXT.md` | 领域术语表（Post/Category/Public Content Snapshot…）+ 关系约束 + 歧义澄清。**描述业务时必须用它定义的词**（如「分类」= Category ≠ Tag；发布即快照替换，无定时发布） |
| `cloudflare.config.ts` | **真正的 Worker 配置**：D1/KV/R2/Queue 绑定、DO exports、定时任务、自定义域。所有值从环境变量读，本地默认占位（`bucket-name-placeholder` 等）。注释明确：**本地固定 D1 UUID 是 `db:migrate:local` 的目标，别改** |
| `vite.config.ts` | paraglide 插件（cookie 策略）、cloudflare 插件（ssr 环境）、tailwind 4、tanstackStart、`@` → ./src 别名。SSR 构建 `codeSplitting: false`（workerd 顶层 await 循环导入 bug，注释在文件里） |
| `drizzle.config.ts` | drizzle-kit（studio/push/generate）配置 |
| `auth-cli.ts` | better-auth CLI 用的独立配置（生成 auth 表 schema） |
| `migrations/` | 手写 SQL 迁移 `0000`~`0027`，`meta/` 是 drizzle 快照 |
| `messages/` | paraglide 源消息 `zh.json` / `en.json`（key 完全一致，新增消息两边都加） |
| `patches/` | `cf@1.0.0-beta.5` 的补丁（package.json patchedDependencies） |
| `project.inlang/` | paraglide 项目配置 |
| `scripts/` | 构建辅助：`generate-orpc-contract.ts`、`verify-translations.ts`（i18n 校验）、`prune-unused-translations.ts`、`ssr-chunk-graph.ts`、`build-engrave-font.ts`（雅黑子集字体，备用） |
| `tests/` | vitest 全局夹具：`apply-migrations.ts`（测试库迁移）、`config-fixture.ts`、`mocks/`、`test-utils.ts` |
| `docs/` | `adr/`（26 个架构决策记录，**做重大改动前查有没有冲突的 ADR**）、`deployment.md`（上游部署图文）、`agents/`（issue tracker / triage / domain 规则）、`research/`（umami 热度同步调研）、`AI-HANDOVER.md`（本文档） |
| `.scratch/` | 本地 issue tracker（markdown）+ e2e 验证脚本（puppeteer）+ 临时资产。**不提交**（gitignore 之外的部分注意别误提交） |
| `.dev.vars` | 本地密钥（GitHub OAuth id/secret 等）。**gitignore 已覆盖，绝对不能提交、不能把内容写进任何文档** |
| `dev-server.log` | dev 服务器输出（后台任务日志、验证邮件链接也在这里）。已 gitignore |

### 6.2 `src/` 顶层

| 路径 | 用途 |
|---|---|
| `src/server.ts` | Worker SSR 入口（TanStack Start） |
| `src/start.ts` | 客户端启动 |
| `src/router.tsx` | Router 创建（dehydrate/hydrate、queryClient 集成） |
| `src/routes/` | 文件路由（见 6.3） |
| `src/routeTree.gen.ts` | 生成的路由树，勿手改 |
| `src/styles.css` | **全站样式基座 + 设计令牌**：`:root` 的 `--fs-*` 字号刻度、颜色变量、`@theme` 的 `--font-sans/--font-mono`。见 §9.8 |
| `src/styles/` | UEG 各页手写 CSS（ueg-home/news/policy/org/org-detail/article/about/draw/engines/motion.css） |
| `src/blog.config.ts` | SiteConfig 的**代码内默认值**（站点名/图标路径/主题 hue）。真实站点配置存 D1 `system_config`，后台可改；这里是兜底 |
| `src/lib/` | 基础设施（见 6.4） |
| `src/features/` | 业务模块（见 6.5） |
| `src/components/` | 跨 feature 的 UI 组件（见 6.6） |
| `src/hooks/` | 通用 hooks（use-debounce、use-motion 等） |
| `src/integrations/` | tanstack-query provider（含 `revive-dates.ts` 日期反序列化）、devtools |
| `src/paraglide/` | i18n 编译产物，gitignore，勿手改 |

### 6.3 `src/routes/`（文件路由）

**布局组**：`__root.tsx`（根：字体、全局样式、devtools）；`_public/route.tsx`（门户布局：导航栏+页脚）→ 所有 UEG 公开页；`_public/_auth/*`（登录注册找回，独立极简布局）；`_public/_user/profile.tsx`（个人中心）；`admin/*`（后台，`admin/route.tsx` 里 `ssr:false` + session 守卫）。

公开页路由 → 页面组件对应关系（路由文件都很薄，负责 loader 预热 + SEO meta + validateSearch，真正 UI 在 features）：

| 路由 | 页面 |
|---|---|
| `_public/index.tsx` | 首页（HomePage，notice/dynamics 两组数据 loader 预热） |
| `_public/posts.tsx` | 新闻动态列表（`categoryType:"news"`，无限滚动） |
| `_public/policy.tsx` | 政策法规列表（`categoryType:"policy"`） |
| `_public/post/$slug.tsx` | 文章详情 |
| `_public/search.tsx`、`_public/$.tsx`（404） | 搜索 / 兜底 |
| `_public/about.tsx` | 关于（UEG 世界观介绍，静态） |
| `_public/organization/index.tsx` + `organization/$slug.tsx` | 机构目录（tabs）+ 机构详情 |
| `_public/navigator.tsx`、`_public/underground.tsx` | 公共服务：避难所导航 / 地下城介绍（静态内容 + tab） |
| `_public/engines.tsx` | 发动机模型观察页（§9.6） |
| `_public/unsubscribe.tsx` | 邮件退订 |

SEO/协议路由：`rss[.]xml.ts`、`atom[.]xml.ts`、`feed[.]json.ts`、`sitemap[.]xml.ts`、`robots[.]txt.ts`、`site[.]webmanifest.ts`、`stats[.]js.ts`（umami 脚本代理）、`images.$.ts`（**R2 透传路由**，见 §9.6）、`api.$.ts`（orpc 挂载）、`api.auth*.ts`（better-auth）、`api.send.ts`（邮件测试发送）。

### 6.4 `src/lib/`

| 模块 | 用途 |
|---|---|
| `lib/orpc/` | orpc 全套：`procedure.ts`（publicProcedure/adminProcedure，admin 挂 session+admin 守卫）、`contract.ts`（聚合各 feature 合约）、`router.ts`、`unwrap-result.ts`（客户端解包——错误分支必须 `() => { throw errors.X(); }` 否则类型不收窄）、`server-client.ts`（SSR 直调）、`contract.generated.json` |
| `lib/db/` | `index.ts`（drizzle 实例）、`schema/*.table.ts`（全部表定义：auth/comments/config/data-source-settings/friend-links/media/post-revisions/posts/search + `helper.ts` 的 createdAt/updatedAt/id 公共列） |
| `lib/auth/` | better-auth 服务端配置（GitHub OAuth、邮箱）、`api-key-guard.ts`（API Key 认证）、`get-request-session.ts` |
| `lib/do/` | 两个 Durable Object：`rate-limiter`（限流）、`post-publisher`（定时发布） |
| `lib/env/` | `server.env.ts`（zod 校验的服务端环境）、`client.env.ts` |
| `lib/errors/` | 统一错误体系：`error.ts` 基类、`request-errors.ts`（PREDEFINED 错误工厂，orpc `.errors()` 用） |
| `lib/http/` | auth 请求处理、限流中间件、turnstile 校验 |
| `lib/queue/` | Queue consumer 分发 |
| `lib/constants.ts` | `R2_DEV_CUSTOM_DOMAIN`（= `https://blog-static.apex-ai.shop`，仅本地透传用）、`CACHE_CONTROL` 全套、`ADMIN_ITEMS_PER_PAGE` |
| `lib/i18n.ts`、`lib/seo.ts`、`lib/shiki.ts`、`lib/turnstile.ts`、`lib/utils.ts`（cn()）、`lib/duration.ts` | 单文件工具 |

### 6.5 `src/features/`（业务模块，每个都是同构分层的目录约定）

标准分层：`schema/`（zod）→ `data/`（drizzle 查询）→ `*.service.ts`（缓存+业务规则）→ `server/router.ts`（orpc 挂载）→ `queries/index.ts`（前端 queryOptions）→ `components/`。测试为 `*.integration.test.ts`（workerd 真实 D1/KV）与 `*.test.ts`（纯逻辑）。

| feature | 用途（上游继承，除非注明 UEG） |
|---|---|
| `posts` | 文章全生命周期：编辑器（post-editor/，TipTap + 自动保存 + 版本历史）、列表/详情/归档渲染、**公开快照（public-snapshot.ts）**、shiki 高亮、toc、RSS/feed、搜索索引入口。UEG 增量：`queries/index.ts` 的通告/动态 query、`ueg-home-sections.tsx`（首页板块）、`ueg-apply-cards.tsx`、`policy-page.tsx`、`format-ueg-post-date.ts`（纪元日期）、`portal-media.ts` |
| `categories` | 分类管理 + **内容归属 streams（UEG 核心）**：`data/category-streams.data.ts`、`category-streams.service.ts`、`components/stream-manager.tsx`（归属 CRUD 弹窗）。见 §9.1 |
| `tags` | 标签（扁平、无层级；与分类语义区别见 CONTEXT.md） |
| `comments` | 评论（发表即公开、删除留占位、AI 审核 flag、邮件/webhook 通知） |
| `media` | 媒体库（R2 上传、引用计数、未使用清理、尺寸探测） |
| `auth` | 登录/注册/找回/邮箱验证/profile 页面与 hooks |
| `config` | 系统配置（站点身份/图标/导航/通知/密钥），JSON 版本化存储（ADR 0025）；`site-config.schema.ts` 定义图标字段——**导航栏/页脚品牌图标从后台读** |
| `cache` | public-cache 引擎（defineEntry/KV）、workers-cache 策略、后台缓存维护页 |
| `engines` | UEG：发动机浏览器 + 模型观察页 + 后台数据源配置（§9.6） |
| `organization` | UEG：机构目录/详情/架构图（§9.5），数据硬编码在 `data/organizations.ts` |
| `about` / `public-service` | UEG 静态页：关于 / 避难所导航（navigator-page）+ 地下城（underground-page）+ program-tabs |
| `search` | D1 FTS5 搜索（维护页可重建索引） |
| `post-popularity` | umami 数据 → 30 天热度榜（定时任务驱动） |
| `dashboard` | 后台首页统计 |
| `email` | SMTP 连接、react-email 模板（AdminNotification/Auth/Reply/FriendLink 系列） |
| `webhook` | 通用 JSON webhook 端点与事件推送 |
| `friend-links` | 友链申请/审核 |
| `muted-users` | 禁言管理 |
| `api-keys` | 后台 API Key 管理（能带 admin 权限调 HTTP API） |
| `notification` | 通知事件 publisher |
| `version` | 上游版本检查（Application Release 语义，见 CONTEXT.md） |
| `site-documents` | 文档响应助手（配合 lib/http/site-document-response） |

### 6.6 `src/components/`

- `layout/`：`public-layout.tsx`（门户壳：Navbar+Footer+Outlet）、`navbar.tsx`+`navbar.css`（**UEG 导航栏**：品牌区两行配文+后台图标、8 个导航项、纪元时钟）、`ueg-era-clock.tsx`（+31 年滚动钟）、`footer.tsx`、`public-nav-link.tsx`、`mobile-menu.tsx`、`language-switcher.tsx`、`theme-*`。
- `admin/`：后台骨架（side-bar、admin-chrome、content-workspace）；**taxonomy 系列**是「分类+标签」二合一管理台（explorer/workspace/posts/model/state），`taxonomy-name-dialog.tsx` 有 `extraField` 插槽（分类弹窗里的归属下拉就是从这进的）。
- `tiptap-editor/`、`content/`（math-formula）、`ui/`（confirmation-modal、fuwari-modal、select、input、date-picker、skeleton 等）、`common/`（error-page、status-page、brand-icon、turnstile）。

---

## 7. 核心机制详解

### 7.1 路由（TanStack Router）

- 文件路由，路由树由 `@tanstack/router-plugin` 在 dev/build 时生成到 `src/routeTree.gen.ts`。**新建路由文件后该文件自动更新；如果编辑器/类型报路由不存在，跑一下 dev 或 build 即可。**
- 公开页模式：路由文件导出 `Route`，`loader` 里 `queryClient.ensureQueryData(...)` 预热数据（SSR 就有内容），`validateSearch` 声明 URL 参数（如分页/关键词）。
- 后台 `admin/route.tsx` 设置了 `ssr: false`（纯 CSR + session 守卫）。
- 公开页加载态：`*-skeleton.tsx` 组件 + `useQuery` 的 isPending。

### 7.2 orpc（API 层）

- **合约先行**：每个 feature 在 `server/router.ts` 里定义 procedure（input 用 zod），`lib/orpc/contract.ts` 聚合所有 router，`bun run orpc:contract` 生成 `contract.generated.json`（客户端类型与 openapi 都从这来）。
- **新增一个 API 的完整步骤**：① schema 加 zod → ② data 层加查询 → ③ service 层（挂 public-cache 或 admin 直调）→ ④ `server/router.ts` 加 procedure（公开 `publicProcedure`、后台 `adminProcedure`，错误用 `.errors({...})` 注册）→ ⑤ `bun run orpc:contract` → ⑥ 前端 `queries/index.ts` 写 `orpc.xxx.yyy.queryOptions({ input })` → ⑦ 路由 loader `ensureQueryData` 预热。
- **客户端解包**：`unwrapResult`（`lib/orpc/unwrap-result.ts`）调用时错误分支必须写成 `() => { throw errors.X(); }` 的 IIFE 形式，否则 TS 不收窄（踩过的坑）。
- mutation 后失效缓存：`queryClient.invalidateQueries({ queryKey: orpc.categories.key() })` 这种按 router 前缀失效。

### 7.3 数据库（D1 + drizzle）

- 表定义在 `src/lib/db/schema/*.table.ts`；公共列（id/createdAt/updatedAt）在 `helper.ts`。**改表 = 改 table.ts + 手写 `migrations/00XX_*.sql`**（编号顺延，当前到 0027）。
- 本地迁移：`bun run db:migrate:local`。**生产**：`D1_DATABASE_ID=xxx bun run db:migrate`（或 Cloudflare Workers Builds 构建时跑）。
- `drizzle-kit generate` 可辅助生成，但本项目迁移文件命名要人工整理（0000-0025 是 drizzle 风格名，0026+ 是语义名）。
- 直改本地库的方法与坑：见 §10。

### 7.4 缓存体系（两层 + CDN）

1. **Public Cache（KV 条目缓存）**：`src/features/cache/public-cache.ts` 的 `defineEntry({ name, key, schema, ttl, invalidatedBy, load })`。公开读接口都包这层（posts 列表 key 里含全部过滤参数：page/categoryType/categoryNames/excludeCategoryNames 等）。事件失效：`post.published` / `post.deleted` / `category.changed` / `tag.changed` 等。后台「维护 → 缓存维护」可全清。
2. **Workers Cache API**：`cache: { enabled: true }`（cloudflare.config.ts），按响应的 `CDN-Cache-Control` 缓存 GET。
3. **浏览器/不可变资产**：`/images/$` 路由对 `.glb/.gltf/.geojson/.json/.csv` 给 **1 年 immutable**（`isImmutableDataKey`）——**同名覆盖文件不会刷新缓存，换内容必须换文件名**（用户明确的约定，别加版本号机制）。

### 7.5 i18n（paraglide）

- 源文件 `messages/zh.json` + `messages/en.json`，key 一一对应；编译到 `src/paraglide/`（gitignore）。
- 使用：`import { m } from "@/paraglide/messages"` → `m.some_key()`。
- 改完 messages 必须重跑 `bun run i18n:compile`（`orpc:contract` / `typecheck` 链里也会先编译）。
- `bun run i18n:verify` 校验两边 key 对齐；`i18n:prune-unused` 清理未用 key。
- 语言策略：cookie `LOCALE` → 浏览器语言 → 默认 zh。

### 7.6 认证与权限

- better-auth：`lib/auth/auth.server.ts`（服务端）、`auth.client.ts`（客户端）。GitHub OAuth（dev 凭据在 `.dev.vars`）+ 邮箱密码（受 SMTP 配置门控）。
- **第一个注册/登录用户自动 admin**；后台 `/admin`，`admin/route.tsx` 守卫。
- adminProcedure 在 orpc 层再校验一次（session + role）。

### 7.7 Queue / Durable Objects / 定时

- Queue：`QUEUE` 绑定，`lib/queue/queue.handler.ts` 消费；测试模式不消费（cloudflare.config.ts 里 `isTest` 判断）。
- DO：`RateLimiter`（IP 限流，评论/友链等写接口用）、`PostPublisher`（发布相关）。DO 通过 `exports` 直接暴露（新版部署方式，**不支持再回退到 wrangler migrations 配置**——cloudflare.config.ts 注释里写了）。
- Cron：`15 0 * * *`（每天 00:15）→ 发布到期文章 + popularity 快照。

---

## 8. UEG 业务定制层（本 fork 的核心增量）

> 改动原则（用户反复强调的）：**只做用户口述的东西**。架构图/首页出现过多次「AI 自作主张加了内容被要求删掉」的返工。没说的不要画、不要加、不要"顺手统一"。

### 8.1 内容归属体系（streams）—最重要的数据结构改动

- 迁移 0026（categories.type 列）已被 0027 演进替代：**`category_streams` 表**（id/name/slug，`data_source_settings` 风格的单表 CRUD）+ `categories.stream_slug`（可空外键，NULL=无归属）。0026 的 type 列已在 0027 里删除。
- 规则：
  - 内置两条：**新闻动态=news、政策法规=policy**，**不可删除**（`STREAM_RESERVED`）；仍有分类引用的归属不可删（`STREAM_IN_USE`）。
  - **slug 由服务端按名称生成且不可改**——slug 是与公开页接线的契约（`NEWS_STREAM_SLUG`/`POLICY_STREAM_SLUG` 常量在 `src/lib/db/schema/posts.table.ts`）。
  - 后台入口：分类管理 → 分类弹窗里的「归属」下拉 +「管理归属」按钮（StreamManager 弹窗）；分类名旁小字显示归属名。
- 消费端：
  - `/posts` 吃 news 流（**含未分类文章**）；`/policy` 吃 policy 流。两页 chips 按流过滤。数据层 `getPostsCursor` 的 `categoryType` 参数（'news'/'policy'）用 EXISTS 子查询实现。
  - posts list 过滤参数三件套：`categoryType` / `categoryNames` / `excludeCategoryNames`（缓存 key 已含）。
  - 新增自定义归属**暂无公开页消费**（留余量设计）：要接新页面时，把它的 slug 传给 posts list 的 `categoryType` 参数即可。
- **首页通告栏例外**：按**分类名**取，不走流。常量 `NOTICE_CATEGORY_NAMES = ["政府公告", "紧急通告"]` 在 `src/features/posts/queries/index.ts`——**后台改这两个分类的名字会弄空首页通告栏**，改名需同步常量。

### 8.2 首页（`/`）

- 组件 `src/features/posts/components/home-page.tsx`（导出 HomePage，内含 HeroV2/通告栏/MissionStrip/FeatureCardV2/NewsCardV2），样式在 `src/styles/ueg-home.css` 末尾段落，**scope class 是 `.ueg-homev2-page`**（布局根 `.ueg-home-page` 承载全站画布背景，两者勿混用，重复加会双渲染 ::before 网格）。
- 数据：`noticePostsQuery(5)`（categoryNames 取通告）+ `dynamicsPostsQuery(4)`（排除通告分类）；首页路由不再拉 popularPosts。置顶 pinnedAt 已与通告身份解绑（可做头条/加急）。
- **纪元偏移**：日期显示层 `ERA_YEAR_OFFSET = 49`（数据 2026 → 显示 2075-MM-DD），常量在 home-page.tsx 顶部。
- **任务状态带（MissionStrip，六段单行）**：当前时间 | 到达新家园倒计时 | 全球人口 41.2亿 | 地下城负荷 78.4% | 运行发动机 9,751 | 航速 1,572km/s。**数值是前端常量**（接后端时替换）。倒计时目标固定**纪元 4558-01-01**（必须是固定日历日，"今天+整年数"时分秒永不走动）。分隔线技法：容器 `gap:1px` + 背景色即线色。
- 首页嵌发动机板块（EngineNetworkSection）：`startWhenVisible` 用 IntersectionObserver，**rootMargin 里 0 必须带 px 单位**（写 `"240px 0"` 直接抛异常炸首页 500）。
- **水合坑**：链接内嵌链接（a 嵌 a）会导致整树重建水合失败且报错指向无关组件；链接内的小标签用 `TagToken`（span 版）。

### 8.3 导航栏与页脚

- **纪元时钟**（`ueg-era-clock.tsx`）：现实时间 **+31 年**（与首页 +49 是两套，用户分别要求的），逐位滚动动画（320ms），断点：≤1395px 时分秒换行、≤1099px 随工具区隐藏。工具区只留用户图标。
- **品牌区**：徽章 `<img>` 来自后台 `siteConfig.icons.faviconSvg`（导航栏）/`favicon96`（页脚），空值回退 public 静态文件；配文两行「UEG 联合政府 / UNITED EARTH GOVERNMENT」+ 竖分隔线。用户已上传真徽章。
- 导航项 min-width 84/max-width 100 防第 8 项（发动机浏览器）压搜索框。
- `public-layout.tsx`：内页横幅已整体删除（内页直接接页头，页间距由各页自带 margin-top 提供）。

### 8.4 新闻/政策页头（统一组件式约定）

- `/posts` 与 `/policy` 页头是同一套：`.head > .crumb + h1 > span`，**主体样式在 ueg-news.css 的共用选择器**（`.ueg-news-page .head, .ueg-policy-page .head`）；ueg-policy.css 只留本页装饰。新增同款页头直接复用，**不要再拆类、不要顺手统一 engines 页的 .head（那是独立实现）**。
- 视觉决定（勿回退）：中文简介段已删（用 min-height 锁高：桌面 168px / ≤720px 190px）；英文副标题（NEWS & INFORMATION…）在标题下独立一行 fs-15；crumb fs-12。

### 8.5 机构介绍（/organization）

- **页面结构**（`organization-page.tsx`）：自上而下 = 「UEG 政府组织结构 / GOVERNMENT STRUCTURE」区块（`.section-head` + `.org-tree` 架构图）→ 筛选栏 `.toolbar` → 卡片目录 `.directory` + 侧栏（司局直达/主要节点）→ 「一线执行设施」`.facility-section`。**架构图与目录同页直出，没有 tab**——历史上 dcfd61d0 曾拆成「机构目录 / 政府组织结构」两个 tab，用户要求挪回同页（参照 `preview-organization.html` 的架构图周围版式），已撤销。**页头横幅 `.page-head` 已整体删除**（用户认为多余）：`ueg-org.css` 里 `.ueg-org-page .page-head*` 与 `.ueg-org-page .crumb` 规则一并删净，顶部间距改由 `.section{margin-top:18px}` 提供，与「内页无横幅」的约定一致。注意 `about` 页仍用 `.page-head`（走 `ueg-about.css`），机构详情页仍用 `.crumb`（走 `ueg-org-detail.css`），二者均未受影响。机构详情页 `organization-detail-page.tsx` + `$slug.tsx`。
- **架构图（多轮返工后的最终形态，commit d46dc031 + 后续微调）**：
  - `CHART_ROWS` 世代行数组（organization-page.tsx 顶部）定义层级：
    - gen-1：大会（GOV/01，居中，根卡）
    - gen-2：常委会（GOV/02）左翼、**安理会（SEC/01）正中在大会正下方**、最高法院（JUS/01）右翼，横轨三连
    - gen-3：秘书处（EXE/01）垂直连常委会、军事委员会（SEC/02）垂直连安理会
    - gen-4：科学院（SCI/01）/航天局（ASA/01）/伦理委员会（COM/01）/经社理事会（SEC/11），**秘书处正对科学院**、下行一线分四条
  - 卡片三行制：编号（fs-15 mono 琥珀）/中文名（fs-15）/英文名（**fs-9** mono，曾经改 15 被用户要求退回）。**min-height:90px、内容垂直居中**。
  - 实现：各行铺**共享百分比网格**（gen-2/3 为 repeat(6,1fr)，**gen-4 必须是 repeat(36,1fr)**），连接线纯 CSS（::before/::after 从网格几何生成）。820px 断点退化单列、隐线。
  - **gen-4 为什么是 36 列而不是 18**（2026-10 修）：四张卡的中心必须落在 6/14/22/30 of 36 = 16.667% / 38.889% / 61.111% / 83.333%，这样才同时满足三件事——(a) 关于 50% 中轴左右对称（18 列下是 13.889%…80.556%，整体偏左 2.78%，用户看出「偏左」）；(b) 与 `.gen-4:before` 横轨的 `left/right:16.666%` 两端**严丝合缝**（18 列时横轨右端会越过经社理事会伸出 2.78%，用户看出「往右多伸出来」）；(c) 秘书处（16.667%）正对科学院、竖线连成一条（18 列下科学院在 13.889%，与横轨左端错开，用户看出「线没连上」）。**18 列无法表达所需的半列偏移，别再改回 18。**
  - `shortCode()`：UEG-GOV-001 → `GOV / 01`。
  - **用户没说的东西不要画上图**（角色标注、leafbox、数字生命研究所都因此被删过）。
- **机构数据**硬编码在 `data/organizations.ts`（编号体系 `UEG-<体系>-<序号>`：GOV/SEC/EXE/JUS/SCI/ASA/COM/HUM；SCI-014 跳号是彩蛋）。units 已按设定集同步（秘书处五司、军委会三军、法院两庭）。
- **悬而未决**：难民署（HUM/01）、粮食计划署（HUM/02）未上图（等用户定隶属）；其余机构英文名是否统一 `UEG XXX` 短格式已提议未答复。

### 8.6 发动机浏览器与模型观察页（/engines，src/features/engines/）

- **数据原则（红线）**：engines.geojson **不进仓库、不进 public/、不做 localStorage/IndexedDB**。数据/模型在 R2，前端经 `/images/<key>` 透传加载；默认 key 在 `lib/engine-assets.ts`（`blog-media/engines/engines.geojson` 3MB + `planetary-engine-draco.glb` 455KB，draco 解码器自托管 public/draco/）。
- 后台「系统设置 → 数据源」tab：管理员填 R2 key（存 `data_source_settings` 表，迁移 0023/0024/0025），空串=回退默认；保存时服务端 R2.head 校验（错误 `*_NOT_FOUND`）。**路径原样使用，无版本号机制**。
- `/images/$` 路由：本地 dev 时 R2 未命中的 key 透传 `R2_DEV_CUSTOM_DOMAIN`（blog-static.apex-ai.shop）。**判断本地必须用请求 host 等运行时信号，不能用 `import.meta.env.DEV`——vite 对 worker 模块不做静态替换，它运行时恒为 undefined**。
- 页面 = 模型观察（ModelObservatory）：行星发动机视口（fixMaterials=true）+ 数字生命卡视口（fixMaterials=false，双人/单人共用 viewport，HUD 切换）。卡片可输入姓名**实时刻印**（Decal 贴图 canvas 重绘，`texture.image = canvas` 换源 + needsUpdate——只改 canvas 不换源 GPU 看不到）。
- maplibre v6 坑：必须 `import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url"` + `setWorkerUrl(workerUrl)`；聚合属性是 `cluster_id`（snake_case）。
- 3D 模型层：zoom≥4 只把**散点**换 GLB 实例，聚合簇恒为圆点；实例矩阵只在 moveend/数据/投影切换时重建；GLB 处理血泪（丢 index 变三角形汤、负缩放节点翻转绕序、stripDeadTextureReferences 只剥死引用——曾把卡片贴图剥光导致白模）。
- 相机按包围球自适应；模型抬升 MODEL_ALTITUDE_METERS=120 + polygonOffset 治共面闪烁；globe/mercator 切换有滞后带。
- **验证方式**：ZCode 内嵌浏览器 WebGL 画不了地图数据（环境缺陷）；用 puppeteer-core + 系统 Chrome（`C:/Program Files (x86)/Google/Chrome/Application/chrome.exe`）headless + `--enable-unsafe-swiftshader`，脚本放 `.scratch/e2e/`。WebGL canvas 像素采样无效（preserveDrawingBuffer 未开），视觉验证靠截图或导出 2D canvas。调试句柄：`window.__engineModelDebug()`、`window.__cardEngraveCanvas`。
- 刻印字体：系统雅黑栈为正选；**public/fonts/msyh-bold-engrave.woff2（474KB 雅黑 Bold 子集）是备而未用的退路，上线前建议删除（版权风险）**；windfonts 在线字体探测已接线（CDN 一直 502 未验证）。

### 8.7 其他 UEG 静态页

- `/about`（ueg-about.css）：UEG 世界观/历史沿革，静态内容。
- `/navigator`（public-service/navigator-page.tsx）：避难所导航服务页。
- `/underground`（underground-page.tsx）：地下城介绍（program-tabs 组件切 tab）。
- `/policy`：政策法规列表（policy-page.tsx，与 posts-page 同构，吃 policy 流）。
- `format-ueg-post-date.ts`：UEG 纪元日期格式化；`portal-media.ts`：门户媒体工具。

### 8.8 样式令牌体系（改样式前必读）

- **字号**：公开页一律引用 `src/styles.css` `:root` 的 `--fs-<px>` 令牌（rem 计价，名字=16px 根字号下的像素值，如 `--fs-15`；另有 `--fs-hero` 流式、`--fs-mega` 170px）。**新页面禁止写死 px 字号**。
- **字体族**：唯一来源是 styles.css `@theme` 的 `--font-sans`（Roboto+雅黑/苹方/思源回退）与 `--font-mono`（JetBrains Variable 名义，实际靠 ui-monospace 回退）。**别写本地字体栈**。
- 整站缩放改 html font-size 即可。例外（不纳入令牌）：邮件模板（内联 px 是邮件客户端要求）、后台 admin 的 text-[11px] 任意值。
- UEG 配色变量（--accent/--primary2/--title/--muted/--border2 等）在各 ueg-*.css 与 styles.css 定义。
- 各页 H1 尺寸是逐页设计过的（45/40/35/34/32/28…），用户未要求合并档位，别"顺手统一"。

---

## 9. 本地开发坑大全（每条都真实踩过）

1. **node 版本**：dev、typecheck、任何跑 cloudflare.config.ts 的命令都要 node ≥22.18 → `export PATH="/f/nvm/nvm/v24.9.0:$PATH"`。
2. **vite mtime 缓存坑（Windows）**：用脚本/python/sed 改完源文件后 vite 可能仍渲染旧模块（mtime 粒度问题；症状：curl 直出 HTML 是新的、浏览器 DOM 是旧的）。**改完 `touch` 该文件**。
3. **双 dev 实例**：3000+3001 并发会导致 miniflare SQLite 锁竞争 + workerd 内存膨胀（后台管理全是骨架屏的根因）。杀全进程树，只跑一个。
4. **清缓存顺序**：`.wrangler/state/v3/cache` 换资产后要删，但**必须先杀 workerd/bun 进程再删**（否则 Device or resource busy），删完重启。
5. **直改本地 D1**：`cf d1 query` 没有本地等价；用 `bun -e` + `bun:sqlite` 直接开 `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/<hash>.sqlite`。**Git Bash 命令行传中文会被编码损坏——SQL 写成 UTF-8 文件 `.read` 执行或按 id 操作**。直改后必须手动清 KV 缓存（`v0:post*`、`public:categories:*` 等键）或重启，否则页面读旧数据；走后台 API 改则自动失效。
6. **本地 R2 模拟**：dev 绑定的桶是 `bucket-name-placeholder`（vite 不注入 .env 到 process.env），key 带 `blog-media/` 前缀。播种：`bunx cf r2 objects put "<key>" --bucket-name bucket-name-placeholder --file <path> --content-type <mime> --local --persist-to .wrangler/state`（不支持本地 delete）。换资产 = put → 停服 → 删 cache 目录 → 重启 → curl 验证字节数。带 query 参数可绕过平台缓存验证。
7. **改 `.dev.vars` 后必须重启 dev**（且 vite 自动重载不可靠，看日志里 "[vite] server restart failed"）。
8. **Python 正则灾难性回溯**：处理大 CSS 别写嵌套量词 `(?:...)+`（曾卡死后台任务），用索引切割/逐行处理。
9. **grid 占位**：共享网格里新增卡片忘了 `grid-column: x/y` 会挤在左半屏。
10. **pre-push 失败先看 node 版本**，再看是不是生成物过期（跑 orpc:contract）。

---

## 10. 部署（生产）

- **方式**：Cloudflare Workers Builds（GitHub 集成，构建命令来自 docs/deployment.md 图文），或本地 `bun run build && bun run deploy`。
- **环境变量/密钥**：通过 Workers Builds 的 build variables 与 Worker secrets 配置（`.env` 不会被 cloudflare.config.ts 读取）。必需：`D1_DATABASE_ID`、`KV_NAMESPACE_ID`、`BUCKET_NAME`、`QUEUE_NAME`、`DOMAIN`（生产 `blog-static.apex-ai.shop` 是 R2 公开自定义域，主站在 apex-ai.shop 域下）、GitHub OAuth、SMTP 等。
- **上线前必做**：`bun run db:migrate` 依次应用 **0026、0027**（生产库还没跑）；后台数据源 tab 填发动机/卡片 R2 key（注意 R2 实际 key 可能**不带** `blog-media/` 前缀，以 R2 面板一字不差为准）。
- **R2 静态域**：媒体 key 换内容要换文件名（immutable 缓存一年）。
- **cf CLI**：`bunx cf` 是 2026 beta，替代 wrangler 日常操作；`bunx cf cli search "<task>"` 找命令。

---

## 11. 测试

- `bun test`（vitest）：`*.integration.test.ts` 用 `@cloudflare/vitest-plugin` 起 **真实 workerd + 本地 D1/KV/R2**（`tests/apply-migrations.ts` 先跑迁移）；纯逻辑 `*.test.ts` 用 node 环境（vitest.node.config.ts）。
- 分类/归属相关测试在 `categories.integration.test.ts`、`category-options.integration.test.ts`、`posts.integration.test.ts`、`taxonomy.integration.test.ts`——**改 schema 断言要跟着补**（历史上新增字段后 4 个测试失败过）。
- E2E/视觉验证：puppeteer-core + 系统 Chrome，脚本放 `.scratch/e2e/`（如 `shoot-org.cjs` 截 /organization 列表与详情）。

---

## 12. 上游同步策略（上游已发 3.2.0，本地基于 3.0.0）

- main 历史里的 `5efcd199`（chore: release v3.0.0）是干净上游基线；本 fork 全部 UEG 改造在 developer 分支（自 b3c5d2c5 起的快照 + 后续提交）。
- 推荐路径：**merge 上游 v3.2.0 tag 到 developer**（基线三方合并，保留 UEG 改动）；单个小功能也可 cherry-pick。
- 冲突重点：
  - **迁移编号冲突**：上游若也发了 0026/0027，重命名本地迁移顺延编号（本地的语义命名比 drizzle 随机名好辨认）。
  - **生成物**（contract.generated.json、routeTree.gen.ts、src/paraglide）：冲突一律以重新生成为准，勿手改合并。
  - `messages/*.json`：两边 key 都保留。
  - UEG 定制文件多为新增（untracked→已提交），冲突少；上游改动大的上游文件（navbar、home-page 等）要人工裁决保留 UEG 版本。
- 同步前先跑全量测试 + `bun run check`。

---

## 13. 安全红线与版权（不要违反）

1. **`.dev.vars` 含 GitHub OAuth 密钥**：已被 gitignore，绝不提交、绝不把内容写进文档/issue/commit。
2. **engines.geojson（真实发动机数据）**：不进仓库、不进 public/、不做 localStorage/IndexedDB——只走 R2 + /images 透传。
3. **`public/models/*.glb` 不入库**（用户 WIP 阶段约定；正式版入库需用户发话）。
4. **微软雅黑字体版权**：CSS 系统字体栈是安全的；`public/fonts/msyh-bold-engrave.woff2`（雅黑 Bold 子集 474KB）是备而未用的退路——**上线前建议删除**，除非用户明确接受风险。
5. **永远不动 main/master**。
6. `.scratch/` 里的临时资产（glb/png/txt）别提交。

---

## 14. 已知遗留与待办（接手后可能被点名的）

| 事项 | 状态 |
|---|---|
| 生产迁移 0026/0027 未跑 | 用户部署时执行 `bun run db:migrate` |
| 难民署（HUM/01）、全球粮食计划署（HUM/02）未上架构图 | 等用户口述隶属关系 |
| 架构图其余机构英文名是否统一 `UEG XXX` 短格式 | 已提议，用户未答复（现有：SECRETARIAT/ACADEMY OF SCIENCES/SPACE AGENCY 已改短） |
| 架构图与页头之间 18px 间距 | `.org-tree` 自带 `margin-top:18px`（tab 时期留下的），预览 html 里是紧贴；用户未表态，保留未动 |
| `.tnode-code` 字号 fs-15 对"编号"可能偏大 | 用户已接受现状；若嫌大可单独回调（en 已是 fs-9） |
| 首页通告栏按分类名匹配 | 后台改「政府公告」「紧急通告」名字会弄空通告栏；长期可升级为第三种归属（notice 流） |
| 首页 MissionStrip 六段数值为前端常量 | 接后端时替换 |
| windfonts 在线字体 CDN 502 | 探测不到会静默走系统栈，无功能影响 |
| 发动机 geojson 31% 点间距 <35km 会重叠 | 用户回去改生成器（最极端一对差 0.1km） |
| 上游 3.2.0 未合并 | 见 §12 |

---

## 15. AI 工作区设施（AGENTS.md 体系）

- **Issue tracker**：`.scratch/<feature-slug>/PRD.md` + `issues/NN-<slug>.md`，状态写在文件头 `Status:` 行。五态 triage：`needs-triage / needs-info / ready-for-agent / ready-for-human / wontfix`（docs/agents/triage-labels.md）。
- **Domain docs**：探索代码前先读 `CONTEXT.md`（领域术语表）与相关 ADR；输出中用术语表词汇（Post≠Article、Category≠Tag≠栏目）；提议与 ADR 冲突时要显式指出，不许静默覆盖。CONTEXT.md / docs/adr/ 由 domain 工作流惰性创建。
- **本文件**：`docs/AI-HANDOVER.md`。项目事实变化（新迁移、新页面、新约定）时**更新本文档**，让下一位接手者不重复踩坑。

---

## 16. 最近 25 次提交（了解改造脉络）

```
7b0940d6 fix(organization): tighten chart card min-height to 90px
9137aef4 fix(organization): revert chart English name font size to fs-9
c82c995b fix(organization): chart typography scale and even card heights
afe34b03 fix(organization): shorten three official English names
a143ff36 fix(organization): drop the role notes from chart cards
d46dc031 fix(organization): symmetric generational chart on a shared grid
5eb4208e fix(organization): chart shows only the described rows, centered
a1e354e8 fix(organization): generational org chart rows
0bcdfcb7 fix(organization): keep the horizontal chart layout for the canon tree
dcfd61d0 feat(organization): tabbed page with full structure tree per canon
3a3c0b4b fix(organization): drop the military commission sub-link from the chart
c6398314 fix(organization): branch nodes match root style in the structure chart
fe7b6f88 feat(organization): complete the structure chart, de-duplicate sidebar
03a268b2 fix(organization): text cleanup on directory and detail pages
dd27ddaa feat: content streams become admin-CRUD-able (内容归属)
bf4043f9 feat: category stream type splits news vs policy feeds
cee8365a feat: news/policy tier-1 cleanup — drop filler micro-text, fix font sizes and contrast
8ac94040 feat: declutter news/policy pages, fix font sizes and contrast (tier 2)
858a5449 feat: play baked GLB animations via AnimationMixer
6ede7bf9 feat: add space station preview block with starfield scene and admin key
36e34ebc feat: wire windfonts online font set into card engraving with graceful fallback
a3b4e40d fix: revert engraving to system font stack, log model load errors
e9d0b69e feat: bundle Microsoft YaHei Bold subset webfont for card engraving
d6cddf6a fix: engrave name directly on transparent card face, no panel
8464d75c fix: restore translucent panel behind engraved card name
```

> 注意 `fix(organization)` 系列的高返工频率——那不是代码质量问题，是**需求只能通过用户逐轮口述澄清**。接手者请坚持「用户没说的不做」。
