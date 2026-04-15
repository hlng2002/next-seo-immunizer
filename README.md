# next-seo-immunizer

Next.js 博客三重免疫系统 — 脚手架 + 构建时校验 + AI 规则引擎，让你的博客永远不会因为 AI 幻觉或人类健忘而上线残缺页面。

## 三条命令接入

```bash
# 1. 复制脚本到你的项目
cp create-post.js your-project/scripts/create-post.js
cp verify-seo.js your-project/scripts/verify-seo.js

# 2. 添加 npm scripts
# "post:new": "node scripts/create-post.js",
# "post:verify": "node scripts/verify-seo.js",
# "build": "pnpm post:verify && pnpm --filter './apps/*' build"

# 3. 写入 CLAUDE.md 铁律（见下方）
```

## create-post.js — 交互式脚手架 + 自动路由注册

运行 `pnpm post:new`，自动生成包含以下满配 SEO 标签的 `page.tsx`，**同时自动注入路由注册表**，从生成到上线路由，100% 零人工干预。

| 防御层 | 作用 | 缺失后果 |
|--------|------|----------|
| `alternates.canonical` | 规范链接 | 被视为重复内容 |
| `generateBlogPostingJsonLd` | BlogPosting 结构化数据 | Google 富文本出不来 |
| `openGraph` | 社交媒体分享卡片 | 分享只有光秃秃链接 |
| `twitter` | Twitter/X 分享卡片 | 推文没有预览 |
| `min-h-screen + bg-*` | 移动端容器 | 高度塌陷、背景断层 |

> 本脚手架不仅生成防弹模板，还能自动定位并注入路由注册表。一条命令，从生成到上线路由，100% 零人工干预。

## verify-seo.js — 构建时铁闸

运行 `pnpm post:verify`，扫描所有博客文章的 `page.tsx`，做 SEO 完整性 + 布局结构检查。任何违规直接 `process.exit(1)`，构建崩溃，部署阻断。

检查项：
- JSON-LD 结构化数据（`generateBlogPostingJsonLd`）
- 规范链接（`alternates: { canonical:`）
- OpenGraph 协议标签
- 移动端容器（`min-h-screen`）
- 亮暗模式背景色（`bg-zinc-50` / `dark:bg-zinc-950`）
- 外层空 Fragment `<>` 检测（AI 最爱偷偷替换成 Fragment 导致布局崩塌）

## CLAUDE.md 铁律

在你的项目根目录 `CLAUDE.md` 中加入以下内容，约束 AI 编程助手：

```markdown
## 发布文章 SEO 铁律

1. 新建文章必须使用脚手架：运行 `pnpm post:new`
2. 构建前自动拦截：`pnpm build` 已集成 `pnpm post:verify` 卡点
3. 严禁手动复制粘贴创建新文章的 page.tsx
```

## 防御纵深

```
手动创建 page.tsx → 忘记加 min-h-screen 容器
    ↓
git commit → git push → CI/CD 触发 docker build
    ↓
docker build 执行 pnpm build → 先跑 verify-seo.js
    ↓
检测到外层是 <> → process.exit(1)
    ↓
❌ 构建崩溃，部署被阻断
```

## License

MIT
