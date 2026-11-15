// macOS fallback for installers that exit without downloading the Electron binary.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} 未完成（退出码 ${result.status}）`);
}
function installBundle(source, root) {
  const relative = 'Electron.app/Contents/MacOS/Electron';
  const framework = 'Electron.app/Contents/Frameworks/Electron Framework.framework/Electron Framework';
  fs.accessSync(path.join(source, relative), fs.constants.X_OK);
  fs.accessSync(path.join(source, framework), fs.constants.R_OK);
  const stage = fs.mkdtempSync(path.join(root, '.repair-'));
  try {
    const prepared = path.join(stage, 'prepared');
    // Framework bundles use relative symlinks: never rewrite them to the extraction path.
    fs.cpSync(source, prepared, { recursive: true, verbatimSymlinks: true });
    fs.accessSync(path.join(prepared, framework), fs.constants.R_OK);
    const dist = path.join(root, 'dist');
    const previous = path.join(stage, 'previous');
    const existed = fs.existsSync(dist);
    if (existed) fs.renameSync(dist, previous);
    try { fs.renameSync(prepared, dist); }
    catch (error) { if (existed) fs.renameSync(previous, dist); throw error; }
    fs.writeFileSync(path.join(root, 'path.txt'), relative);
  } finally { fs.rmSync(stage, { recursive: true, force: true }); }
}
function repair() {
  if (process.platform !== 'darwin') throw new Error('此修复工具用于 macOS。');
  const root = path.dirname(require.resolve('electron/package.json'));
  const { version } = require(path.join(root, 'package.json'));
  if (!['arm64', 'x64'].includes(process.arch)) throw new Error('不支持的 Mac 架构。');
  const filename = `electron-v${version}-darwin-${process.arch}.zip`;
  const expected = require(path.join(root, 'checksums.json'))[filename];
  if (!/^[a-f0-9]{64}$/i.test(expected || '')) throw new Error('缺少官方 SHA-256 校验值，停止安装。');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'desktop-dog-electron-'));
  try {
    const zip = path.join(temp, filename);
    console.log('正在下载官方 Electron 文件，请等待进度达到 100%。');
    run('/usr/bin/curl', ['--fail', '--location', '--proto', '=https', '--proto-redir', '=https', '--retry', '2', '--connect-timeout', '30', '--max-time', '600', '--output', zip,
      `https://github.com/electron/electron/releases/download/v${version}/${filename}`]);
    const actual = crypto.createHash('sha256').update(fs.readFileSync(zip)).digest('hex');
    if (actual !== expected.toLowerCase()) throw new Error('下载文件校验失败，停止安装，请重试。');
    console.log('文件校验通过，正在解压……');
    const extracted = path.join(temp, 'extracted');
    run('/usr/bin/ditto', ['-x', '-k', zip, extracted]);
    installBundle(extracted, root);
    console.log('Electron 修复完成。现在可以运行 npm start，或双击「启动小狗.command」。');
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
if (require.main === module) {
  try { repair(); } catch (error) {
    console.error('修复没有完成：' + error.message);
    console.error('请把上面的输出发来；无需关闭 macOS 安全设置或证书校验。');
    process.exitCode = 1;
  }
}
module.exports = { repair, installBundle };
