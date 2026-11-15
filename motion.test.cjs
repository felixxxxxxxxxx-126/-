const { test } = require('node:test');
const assert = require('node:assert/strict');
const { step } = require('./motion.cjs');
const bounds = { x: 400, y: 300, width: 380, height: 420 };
const area = { x: 0, y: 0, width: 1440, height: 900 };
test('follows distant cursor at bounded speed and faces cursor', () => {
  const next = step(bounds, { x: 1100, y: 530 }, area, .04, true);
  assert.equal(next.x, 404);
  assert.equal(next.y, 300);
  assert.equal(next.facing, 'right');
  assert.equal(next.walking, true);
});
test('stops close to mouse and when follow is paused', () => {
  const near = step(bounds, { x: 600, y: 530 }, area, .04, true);
  assert.equal(near.walking, false);
  assert.equal(near.near, true);
  const paused = step(bounds, { x: 1100, y: 530 }, area, .04, false);
  assert.equal(paused.x, bounds.x);
  assert.equal(paused.walking, false);
});
test('stays in visible work area, including screens with negative coordinates', () => {
  const leftScreen = { x: -1440, y: -200, width: 1440, height: 900 };
  const next = step({ ...bounds, x: -1440, y: -200 }, { x: -2000, y: -1000 }, leftScreen, 2, true);
  assert.equal(next.x, -1440);
  assert.equal(next.y, -200);
  assert.equal(next.walking, false);
});
