const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
function setup() {
  const elements = {};
  for (const key of ['#dog', '#bubble', '#effect', 'nav', 'main', '[data-action="follow"]', '[data-action="sleep"]']) {
    elements[key] = { textContent: '', className: '', dataset: {}, setAttribute() {}, getBoundingClientRect() { return { left: 0, top: 0, width: 320, height: 290 }; }, events: {}, addEventListener(name, fn) { this.events[name] = fn; }, setPointerCapture() {} };
  }
  const calls = [];
  const context = { document: { querySelector: s => elements[s] }, window: { desktopDog: { startDrag: () => calls.push('start'), moveDrag: () => calls.push('move'), endDrag: () => calls.push('end'), quit: () => calls.push('quit'), setState: s => calls.push(s), onCursor: cb => { context.cursor = cb; } } }, setTimeout: () => 1, clearTimeout() {} };
  vm.createContext(context);
  vm.runInContext(readFileSync(__dirname + '/renderer.js', 'utf8'), context);
  return { elements, calls, cursor: s => context.cursor(s), act: a => vm.runInContext(`act(${JSON.stringify(a)})`, context) };
}
test('pet, food and play produce distinct feedback', () => {
  const { elements: e, act } = setup();
  act('pet'); assert.match(e['#bubble'].textContent, /摸摸/);
  act('feed'); assert.equal(e['#effect'].textContent, '🦴');
  act('play'); assert.equal(e['#dog'].className, 'playing');
});
test('sleep toggles and keyboard activation wakes the dog', () => {
  const { elements: e, act } = setup();
  act('sleep'); assert.equal(e['#dog'].className, 'sleeping');
  e['#dog'].events.click({ detail: 0 });
  assert.equal(e['[data-action="sleep"]'].textContent, '休息');
  assert.match(e['#bubble'].textContent, /睡醒/);
});
test('drag moves window without triggering pet; click pets', () => {
  const { elements: e, calls } = setup();
  const events = e['#dog'].events;
  events.pointerdown({ button: 0, screenX: 0, screenY: 0, pointerId: 1 });
  events.pointermove({ screenX: 30, screenY: 20 });
  events.pointerup({ type: 'pointerup' });
  assert.deepEqual(calls, ['start', 'move', 'end']);
  assert.equal(e['#bubble'].textContent, '');
  events.pointerdown({ button: 0, screenX: 0, screenY: 0, pointerId: 2 });
  events.pointerup({ type: 'pointerup' });
  assert.match(e['#bubble'].textContent, /摸摸/);
});
test('follow toggles, hover pauses pursuit, and sleep propagates to desktop', () => {
  const { elements: e, calls, act, cursor } = setup();
  act('follow');
  assert.equal(calls.at(-1).following, true);
  e.main.events.pointerenter();
  assert.equal(calls.at(-1).hovered, true);
  act('sleep');
  assert.equal(calls.at(-1).sleeping, true);
  cursor({ walking: true, facing: 'right', near: true });
  assert.equal(e['#dog'].dataset.walking, 'false');
  act('follow');
  assert.equal(calls.at(-1).following, false);
});
test('moving mouse across head strokes dog; stationary hover does not', () => {
  const { elements: e } = setup();
  const move = e['#dog'].events.pointermove;
  move({ clientX: 60, clientY: 60 });
  assert.equal(e['#bubble'].textContent, '');
  move({ clientX: 90, clientY: 65 });
  assert.match(e['#bubble'].textContent, /摸摸/);
});
