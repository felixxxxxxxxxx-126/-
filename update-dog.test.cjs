const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
function exercise(corrupt) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dog-update-test-'));
  try {
    fs.writeFileSync(path.join(root, 'package.json'), '{"name":"my-desktop-dog"}');
    fs.writeFileSync(path.join(root, 'main.cjs'), 'old application');
    fs.mkdirSync(path.join(root, 'node_modules/electron'), { recursive: true });
    fs.writeFileSync(path.join(root, 'node_modules/electron/keep'), 'installed runtime');
    const status = {};
    const mockedRequire = name => name === 'node:child_process' ? { spawnSync(_cmd, args) {
      const name = args.at(-1).split('/05ab4aa528a62da07f068b31ee099fffa4ee453b/')[1];
      const target = args[args.indexOf('--output') + 1];
      fs.writeFileSync(target, corrupt ? 'invalid download' : fs.readFileSync(path.join(__dirname, name)));
      return { status: 0 };
    } } : require(name);
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'update-dog.cjs'), 'utf8'), {
      require: mockedRequire, __dirname: root, console: { log() {}, error() {} }, process: status
    });
    assert.equal(fs.readFileSync(path.join(root, 'node_modules/electron/keep'), 'utf8'), 'installed runtime');
    if (corrupt) {
      assert.equal(status.exitCode, 1);
      assert.equal(fs.readFileSync(path.join(root, 'main.cjs'), 'utf8'), 'old application');
    } else {
      assert.equal(status.exitCode, undefined);
      assert.equal(fs.readFileSync(path.join(root, 'main.cjs'), 'utf8'), fs.readFileSync(path.join(__dirname, 'main.cjs'), 'utf8'));
      assert.ok(fs.existsSync(path.join(root, 'assets/dog-sprites.png')));
    }
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
}
test('in-place updater installs matching app files and keeps Electron', () => exercise(false));
test('in-place updater rejects corrupt download without changing app', () => exercise(true));
