/**
 * 修复 GitHub Pages 子路径部署的资源路径问题
 * 1. 将 index.html 中的绝对路径转换为相对路径
 * 2. 修复 JavaScript bundle 中的资源路径
 */
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '../dist');
const indexPath = path.join(distDir, 'index.html');
const nojekyllPath = path.join(distDir, '.nojekyll');
const baseUrl = '/MapGPT_Web';

console.log('🔧 修复 GitHub Pages 路径...');

// 1. 读取并修复 index.html
let html = fs.readFileSync(indexPath, 'utf8');

// 替换绝对路径为带 baseUrl 的路径
html = html.replace(/src="\/_expo\//g, `src="${baseUrl}/_expo/`);
html = html.replace(/href="\/_expo\//g, `href="${baseUrl}/_expo/`);
html = html.replace(/src="\/assets\//g, `src="${baseUrl}/assets/`);
html = html.replace(/href="\/assets\//g, `href="${baseUrl}/assets/`);

// 写回文件
fs.writeFileSync(indexPath, html, 'utf8');
console.log('✅ index.html 路径修复完成');

// 2. 修复 JavaScript bundle 中的资源路径
const jsDir = path.join(distDir, '_expo/static/js/web');
const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));

jsFiles.forEach(jsFile => {
  const jsPath = path.join(jsDir, jsFile);
  let jsContent = fs.readFileSync(jsPath, 'utf8');
  
  // 修复资源路径：将 /assets/ 替换为 /MapGPT_Web/assets/
  jsContent = jsContent.replace(/"\/(assets\/[^"]+)"/g, `"${baseUrl}/$1"`);
  jsContent = jsContent.replace(/'\/(assets\/[^']+)'/g, `'${baseUrl}/$1'`);
  
  fs.writeFileSync(jsPath, jsContent, 'utf8');
  console.log(`✅ 已修复 ${jsFile} 中的资源路径`);
});

// 3. 创建 .nojekyll 文件（防止 GitHub Pages 使用 Jekyll 处理 _expo 文件夹）
fs.writeFileSync(nojekyllPath, '', 'utf8');

console.log('✅ 路径修复完成！');
console.log(`   baseUrl: ${baseUrl}`);
console.log('✅ 已创建 .nojekyll 文件');

