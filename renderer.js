const dog = document.querySelector('#dog');
const bubble = document.querySelector('#bubble');
const effect = document.querySelector('#effect');
const api = window.desktopDog;
let sleeping = false, timer, pointer;
let following = false, hovered = false, lastStroke = 0, strokePoint;
const followButton = document.querySelector('[data-action="follow"]');
function sync() {
  dog.dataset.sleeping = String(sleeping);
  api?.setState?.({ following, sleeping, hovered });
}
document.querySelector('main').addEventListener('pointerenter', () => { hovered = true; sync(); });
document.querySelector('main').addEventListener('pointerleave', () => { hovered = false; strokePoint = null; sync(); });
api?.onCursor?.(state => {
  dog.dataset.walking = String(state.walking && !sleeping && !pointer);
  if (!pointer && !hovered && !sleeping) dog.dataset.facing = state.facing;
  dog.dataset.near = String(state.near && !sleeping);
});
function act(action) {
  if (action === 'follow') {
    following = !following;
    followButton.textContent = following ? '停下' : '跟随';
    followButton.setAttribute('aria-pressed', String(following));
    bubble.textContent = following ? '把鼠标移远一点，我会跟过来！' : '好，我就在这里陪你。';
    sync();
    return;
  }
  clearTimeout(timer);
  dog.className = '';
  effect.textContent = '';
  if (action === 'quit') { api?.quit(); return; }
  if (action === 'sleep') {
    sleeping = !sleeping;
    dog.className = sleeping ? 'sleeping' : 'happy';
    bubble.textContent = sleeping ? '我眯一会儿，点我就醒。' : '睡醒啦，继续陪你！';
    effect.textContent = sleeping ? '💤' : '☀️';
    document.querySelector('[data-action="sleep"]').textContent = sleeping ? '叫醒' : '休息';
    sync();
    return;
  }
  sleeping = false;
  sync();
  document.querySelector('[data-action="sleep"]').textContent = '休息';
  const states = { pet: ['好喜欢你摸摸我。', '♡', 'happy'], feed: ['啊呜，谢谢你的零食！', '🦴', 'happy'], play: ['来呀，一起玩！', '🎾', 'playing'] };
  const state = states[action];
  if (!state) return;
  [bubble.textContent, effect.textContent, dog.className] = state;
  timer = setTimeout(() => { dog.className = ''; effect.textContent = ''; bubble.textContent = '我就在这里陪你。'; }, 3000);
}
document.querySelector('nav').addEventListener('click', event => { const action = event.target.closest('button')?.dataset.action; if (action) act(action); });
dog.addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  pointer = { x: event.screenX, y: event.screenY, moved: false };
  dog.setPointerCapture(event.pointerId);
  api?.startDrag();
});
dog.addEventListener('pointermove', event => {
  if (!pointer) {
    if (sleeping) return;
    const rect = dog.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const onHead = y > 0.08 && y < 0.48 && (dog.dataset.facing === 'right' ? x > 0.53 : x < 0.47);
    const now = Date.now();
    if (onHead && strokePoint && Math.hypot(event.clientX - strokePoint.x, event.clientY - strokePoint.y) > 12 && now - lastStroke > 1200) {
      lastStroke = now;
      act('pet');
    }
    if (!strokePoint || Math.hypot(event.clientX - strokePoint.x, event.clientY - strokePoint.y) > 12) strokePoint = { x: event.clientX, y: event.clientY };
    return;
  }
  if (Math.hypot(event.screenX - pointer.x, event.screenY - pointer.y) > 5) pointer.moved = true;
  if (pointer.moved) api?.moveDrag();
});
function end(event) {
  if (!pointer) return;
  const click = !pointer.moved && event.type === 'pointerup';
  pointer = null;
  api?.endDrag();
  if (click) act(sleeping ? 'sleep' : 'pet');
}
dog.addEventListener('pointerup', end);
dog.addEventListener('pointercancel', end);
dog.addEventListener('lostpointercapture', end);
dog.addEventListener('click', event => { if (event.detail === 0) act(sleeping ? 'sleep' : 'pet'); });
