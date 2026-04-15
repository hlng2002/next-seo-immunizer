#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const BLOG_DIR = path.join(__dirname, '../apps/web/src/app/blog');
const REGISTRY_PATH = path.join(__dirname, '../apps/web/src/lib/blog-registry.ts');

function prompt(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  console.log('\n🚀 创建新文章（强制 SEO 规范 + 自动路由注册）\n');

  const slug = await prompt('文章 slug (英文/拼音横杠连接，如 lock-free-sab): ');
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    console.error('❌ 错误: Slug 格式不正确，只能包含小写字母、数字和中划线');
    process.exit(1);
  }

  const title = await prompt('文章标题 (Title): ');
  if (!title) {
    console.error('❌ 错误: 标题不能为空');
    process.exit(1);
  }

  const description = await prompt('文章描述 (Description, 1-2句话最佳): ');
  if (!description) {
    console.error('❌ 错误: 描述不能为空');
    process.exit(1);
  }

  const keywordsStr = await prompt('关键词 (逗号分隔): ');
  const keywords = keywordsStr.split(',').map(k => k.trim()).filter(Boolean);
  const keywordsCode = keywords.length > 0 ? `['${keywords.join("', '")}']` : '[]';

  const datePublished = new Date().toISOString().split('T')[0];

  const postDir = path.join(BLOG_DIR, slug);
  if (fs.existsSync(postDir)) {
    console.error(`❌ 错误: 目录 ${slug} 已存在！`);
    process.exit(1);
  }

  fs.mkdirSync(postDir, { recursive: true });

  const template = `import { Header } from '@/components/Header'
import type { Metadata } from 'next'
import { generateBlogPostingJsonLd } from '@/lib/jsonld'

export const metadata: Metadata = {
  title: '${title} - DiffServ Lab',
  description: '${description}',
  keywords: ${keywordsCode},
  alternates: { canonical: '/blog/${slug}' },
  openGraph: {
    title: '${title}',
    description: '${description}',
    url: 'https://diffserv.xyz/blog/${slug}',
    siteName: 'DiffServ Lab',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: '${title}',
    description: '${description}',
  },
}

export default function BlogPost() {
  const jsonLd = generateBlogPostingJsonLd({
    title: '${title}',
    description: '${description}',
    url: 'https://diffserv.xyz/blog/${slug}',
    datePublished: '${datePublished}',
  })

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <article className="max-w-3xl mx-auto px-4 py-6 sm:py-10 prose prose-zinc dark:prose-invert prose-sm sm:prose-base prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-code:text-orange-600 dark:prose-code:text-orange-400 prose-headings:scroll-mt-20 overflow-x-hidden">
        <h1>${title}</h1>

        <p className="lead text-zinc-300">
          ${description}
        </p>

        {/* --- 文章正文从这里开始 --- */}

        <h2>第一节</h2>
        <p>正文内容...</p>

        {/* --- 文章正文到这里结束 --- */}

        <hr />

        <p className="text-xs text-zinc-400 not-prose">
          ${datePublished} · diffserv.xyz
        </p>
      </article>
    </div>
  )
}
`;

  fs.writeFileSync(path.join(postDir, 'page.tsx'), template);
  console.log(`\n✅ 文章模板创建成功！`);
  console.log(`📂 路径: apps/web/src/app/blog/${slug}/page.tsx`);
  console.log(`👉 已自动注入 Canonical, JSON-LD, OpenGraph 等极致 SEO 标签`);

  // ---- 自动注入路由注册表 ----
  const tag = await prompt('文章标签 (如: 工程化/SEO/底层/复盘): ');

  if (fs.existsSync(REGISTRY_PATH)) {
    const registryRaw = fs.readFileSync(REGISTRY_PATH, 'utf-8');

    // 用 lastIndexOf(']') 定位数组末尾，零依赖注入
    const lastBracketIdx = registryRaw.lastIndexOf(']');
    if (lastBracketIdx !== -1) {
      const newEntry = `  {
    slug: '${slug}',
    title: '${title.replace(/'/g, "\\'")}',
    description: '${description.replace(/'/g, "\\'")}',
    tag: '${tag || '未分类'}',
    date: '${datePublished}',
  },`;

      const injected = registryRaw.slice(0, lastBracketIdx) + newEntry + '\n]\n';
      const cleanInjected = injected.replace(/\n{3,}/g, '\n\n');

      fs.writeFileSync(REGISTRY_PATH, cleanInjected);
      console.log(`📋 已自动注册到 blog-registry.ts`);
      console.log(`🏷️  标签: ${tag || '未分类'} | 日期: ${datePublished}`);
    } else {
      console.warn('⚠️  blog-registry.ts 格式异常，无法自动注入，请手动添加');
    }
  } else {
    console.warn('⚠️  blog-registry.ts 不存在，请手动创建注册表');
  }

  console.log(`\n🎉 全流程完成！一条命令 = 模板 + SEO + 路由注册，100% 零人工干预！\n`);
  rl.close();
}

main().catch(console.error);
