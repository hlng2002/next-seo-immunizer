#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '../apps/web/src/app/blog');

function checkPosts() {
  console.log('🔍 开始校验博客规范...\n');
  let hasError = false;

  const entries = fs.readdirSync(BLOG_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const pagePath = path.join(BLOG_DIR, entry.name, 'page.tsx');
      if (fs.existsSync(pagePath)) {
        const content = fs.readFileSync(pagePath, 'utf8');
        const errors = [];

        // === SEO 检查 ===
        if (!content.includes('generateBlogPostingJsonLd')) {
          errors.push('[SEO] 缺少 JSON-LD 结构化数据 (generateBlogPostingJsonLd)');
        }
        if (!content.includes('alternates: { canonical:')) {
          errors.push('[SEO] 缺少规范链接 (canonical)');
        }
        if (!content.includes('openGraph:')) {
          errors.push('[SEO] 缺少 OpenGraph 协议标签');
        }

        // === 布局结构检查 ===
        if (!content.includes('min-h-screen')) {
          errors.push('[布局] 缺少 min-h-screen 容器，移动端背景/高度会异常');
        }
        if (!content.includes('bg-zinc-50') || !content.includes('dark:bg-zinc-950')) {
          errors.push('[布局] 缺少 bg-zinc-50 dark:bg-zinc-950 背景色，亮暗模式不一致');
        }
        // return 的最外层必须是 div（不能是空 Fragment <>）
        const returnMatch = content.match(/return\s*\(\s*(<[^>]+>)/);
        if (returnMatch && returnMatch[1] === '<>') {
          errors.push('[布局] 外层使用了空 Fragment <>，应使用 <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">');
        }

        if (errors.length > 0) {
          console.error(`❌ [${entry.name}] 规范检查未通过:`);
          errors.forEach(err => console.error(`   ${err}`));
          hasError = true;
        } else {
          console.log(`✅ [${entry.name}] 全部检查通过`);
        }
      }
    }
  }

  if (hasError) {
    console.error('\n🚫 校验失败！请修复后重试。建议使用 pnpm post:new 创建文章。');
    process.exit(1);
  } else {
    console.log('\n🎉 所有文章均符合规范！（SEO + 布局 + 移动端）');
  }
}

checkPosts();
