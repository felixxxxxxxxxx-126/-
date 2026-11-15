const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { installBundle } = require('./repair-electron.cjs');
test('macOS framework links survive deleting extraction directory and replace broken install', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'dog-repair-test-'));
  try {
    const source = path.join(temp, 'extracted');
    const root = path.join(temp, 'electron');
    const contents = path.join(source, 'Electron.app/Contents');
    const framework = 'Electron.app/Contents/Frameworks/Electron Framework.framework';
    const fw = path.join(source, framework);
    fs.mkdirSync(path.join(contents, 'MacOS'), { recursive: true });
    fs.writeFileSync(path.join(contents, 'MacOS/Electron'), 'executable', { mode: 0o755 });
    fs.mkdirSync(path.join(fw, 'Versions/A'), { recursive: true });
    fs.writeFileSync(path.join(fw, 'Versions/A/Electron Framework'), 'framework');
    fs.symlinkSync('A', path.join(fw, 'Versions/Current'));
    fs.symlinkSync('Versions/Current/Electron Framework', path.join(fw, 'Electron Framework'));
    fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
    fs.symlinkSync('/nonexistent/old-temp', path.join(root, 'dist/broken'));
    installBundle(source, root);
    fs.rmSync(source, { recursive: true });
    const installed = path.join(root, 'dist', framework, 'Electron Framework');
    assert.equal(fs.readFileSync(installed, 'utf8'), 'framework');
    assert.equal(fs.readlinkSync(installed), 'Versions/Current/Electron Framework');
    assert.equal(fs.existsSync(path.join(root, 'dist/broken')), false);
    assert.equal(fs.readFileSync(path.join(root, 'path.txt'), 'utf8'), 'Electron.app/Contents/MacOS/Electron');
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});
test('incomplete extraction leaves existing install untouched', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'dog-repair-test-'));
  try {
    fs.mkdirSync(path.join(temp, 'dist'));
    fs.writeFileSync(path.join(temp, 'dist/keep'), 'existing');
    assert.throws(() => installBundle(path.join(temp, 'missing'), temp));
    assert.equal(fs.readFileSync(path.join(temp, 'dist/keep'), 'utf8'), 'existing');
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});
