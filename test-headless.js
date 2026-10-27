// 无头冒烟测试:桩掉 DOM/Canvas 后跑 600 秒游戏逻辑
'use strict';

const ctxStub = new Proxy({}, {
  get(t, p) {
    if (p === 'createLinearGradient') return () => ({ addColorStop() {} });
    if (p in t) return t[p];
    return () => {};
  },
  set(t, p, v) { t[p] = v; return true; },
});

/**
 * 功能：创建足以替代浏览器 DOM 元素的最小测试桩。
 * 输入：无。
 * 输出：带常用 DOM 属性和方法的模拟元素对象。
 */
function makeEl() {
  return {
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {}, textContent: '', innerHTML: '',
    style: {}, width: 0, height: 0, title: '',
    appendChild() {},
    getContext: () => ctxStub,
  };
}

const startBtn = { cb: null, addEventListener(ev, cb) { this.cb = cb; } };
const respawnBtn = { cb: null, addEventListener(ev, cb) { this.cb = cb; } };

const canvasEl = makeEl();
canvasEl.getContext = () => ctxStub;
canvasEl.width = 1280; canvasEl.height = 720;

global.document = {
  getElementById(id) {
    if (id === 'game') return canvasEl;
    if (id === 'startBtn') return startBtn;
    if (id === 'respawnBtn') return respawnBtn;
    return makeEl();
  },
  createElement() { return makeEl(); },
};
global.window = {};
global.innerWidth = 1280;
global.innerHeight = 720;
global.addEventListener = () => {};
let rafCb = null;
global.requestAnimationFrame = cb => { rafCb = cb; };

require('./game.js');

if (!startBtn.cb) { console.error('FAIL: startBtn 未绑定'); process.exit(1); }
startBtn.cb(); // 开始游戏

// 模拟 600 秒(覆盖昼夜循环 + 僵尸生成)
let ts = 0;
for (let i = 0; i < 600 * 60; i++) {
  ts += 1000 / 60;
  const cb = rafCb; rafCb = null;
  cb(ts);
  if (!rafCb) { console.error('FAIL: rAF 链断开 @' + i); process.exit(1); }
}
console.log('SMOKE OK: 600s 模拟无异常');
