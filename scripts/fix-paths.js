/**
 * 修复 GitHub Pages 子路径部署的资源路径问题
 * 将 index.html 中的绝对路径转换为相对路径
 */
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '../dist');
const indexPath = path.join(distDir, 'index.html');
const nojekyllPath = path.join(distDir, '.nojekyll');
const baseUrl = '/mapgpt_front';

console.log('🔧 修复 GitHub Pages 路径...');

// 读取 index.html
let html = fs.readFileSync(indexPath, 'utf8');

// 替换绝对路径为带 baseUrl 的路径
html = html.replace(/src="\/_expo\//g, `src="${baseUrl}/_expo/`);
html = html.replace(/href="\/_expo\//g, `href="${baseUrl}/_expo/`);
html = html.replace(/src="\/assets\//g, `src="${baseUrl}/assets/`);
html = html.replace(/href="\/assets\//g, `href="${baseUrl}/assets/`);

// 写回文件
fs.writeFileSync(indexPath, html, 'utf8');

// 创建 .nojekyll 文件（防止 GitHub Pages 使用 Jekyll 处理 _expo 文件夹）
fs.writeFileSync(nojekyllPath, '', 'utf8');

console.log('✅ 路径修复完成！');
console.log(`   baseUrl: ${baseUrl}`);
console.log('✅ 已创建 .nojekyll 文件');

