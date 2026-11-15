// Update only application files; keep the installed Electron and node_modules.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const root = __dirname;
const revision = '05ab4aa528a62da07f068b31ee099fffa4ee453b';
const files = {
  "main.cjs": "991a9cfc9d2dacd037f44e3022140a7b94ae3eb53a31d9a8d09144efac0d7e05",
  "motion.cjs": "1a13455691e78a22b785efb80451b63a6272b4275917422ee18b551254b14317",
  "renderer.js": "2b826f32b0acf16b274dec6d7b677dc7d97ee34877693dd1680862f857f8ed29",
  "preload.cjs": "0de5f4f519b58e904d3f8cedf2622b839ab22d4688fd01f2861bd483c92e3759",
  "index.html": "b06a99a685785848274074b6cf422ccf06f8a6afa4b1937825f4ada63e86ac79",
  "style.css": "3daf24071fbeb4c0d5f1ef5ec651c3d44e56c0af4ca5903d3ea94f31e1bf50c8",
  "assets/dog-sprites.png": "64fd0815c1b02461ed6d5ca48034e91495406bd22b942bf7fdf124e5e1431d71",
  "README.md": "ad175005a863553cb3ed2dc2846503857c8945f082a5883e24faa3a470e180b7"
};
function update() {
  if (require(path.join(root, 'package.json')).name !== 'my-desktop-dog') throw new Error('请在原来的小狗文件夹运行更新。');
  const stage = fs.mkdtempSync(path.join(root, '.dog-update-'));
  const installed = [];
  try {
    console.log('正在更新小狗的大小和完整姿态动画，保留已安装的启动组件。');
    for (const [name, hash] of Object.entries(files)) {
      const target = path.join(stage, 'new', name);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      const result = spawnSync('/usr/bin/curl', ['--fail', '--location', '--proto', '=https', '--proto-redir', '=https', '--retry', '2', '--connect-timeout', '30', '--max-time', '180', '--output', target,
        `https://raw.githubusercontent.com/felixxxxxxxxxx-126/-/${revision}/${name}`], { stdio: 'inherit' });
      if (result.error || result.status !== 0) throw new Error('下载未完成：' + name);
      const actual = crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
      if (actual !== hash) throw new Error('文件校验不匹配：' + name);
    }
    for (const name of Object.keys(files)) {
      const target = path.join(root, name);
      const backup = path.join(stage, 'old', name);
      const existed = fs.existsSync(target);
      if (existed) { fs.mkdirSync(path.dirname(backup), { recursive: true }); fs.copyFileSync(target, backup); }
      fs.mkdirSync(path.dirname(target), { recursive: true });
      installed.push({ name, existed });
      fs.copyFileSync(path.join(stage, 'new', name), target);
    }
    console.log('更新完成！小狗已缩小，动画已改为完整姿态帧。');
  } catch (error) {
    for (const { name, existed } of installed.reverse()) {
      if (existed) fs.copyFileSync(path.join(stage, 'old', name), path.join(root, name));
      else fs.rmSync(path.join(root, name), { force: true });
    }
    throw error;
  } finally { fs.rmSync(stage, { recursive: true, force: true }); }
}
try { update(); } catch (error) { console.error('更新未完成：' + error.message); process.exitCode = 1; }
