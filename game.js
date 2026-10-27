'use strict';
/* 像素大陆 —— Terraria 风格 2D 侧视沙盒生存 */

// ---------- 基础常量 ----------
const TILE = 16;
const ZOOM = 2.2;
const W = 520, H = 150;
const GRAV = 40, MAXFALL = 26;
const DAY_LEN = 210, NIGHT_LEN = 150;
const REACH = 4.8;

const T = { AIR:0, GRASS:1, DIRT:2, STONE:3, BEDROCK:4, TREE:5, LEAF:6,
            COAL:7, IRON:8, GOLD:9, TORCH:10, BENCH:11, WOOD:12 };
const SOLID = new Set([T.GRASS, T.DIRT, T.STONE, T.BEDROCK, T.COAL, T.IRON, T.GOLD, T.WOOD]);

const TILEINFO = {
  [T.GRASS]:  { hard:0.40, tier:0, drop:'dirt'  },
  [T.DIRT]:   { hard:0.35, tier:0, drop:'dirt'  },
  [T.STONE]:  { hard:0.80, tier:1, drop:'stone' },
  [T.COAL]:   { hard:0.90, tier:1, drop:'coal'  },
  [T.IRON]:   { hard:1.10, tier:2, drop:'iron'  },
  [T.GOLD]:   { hard:1.30, tier:3, drop:'gold'  },
  [T.TREE]:   { hard:0.50, tier:0, drop:'wood'  },
  [T.LEAF]:   { hard:0.08, tier:0, drop:null    },
  [T.WOOD]:   { hard:0.50, tier:0, drop:'wood'  },
  [T.TORCH]:  { hard:0.05, tier:0, drop:'torch', anyTool:true },
  [T.BENCH]:  { hard:0.30, tier:0, drop:'bench', anyTool:true },
  [T.BEDROCK]:{ hard:Infinity, tier:99, drop:null },
};

const ITEMS = {
  dirt:  { name:'土块',   kind:'block', tile:T.DIRT,  col:'#8d5a3a' },
  stone: { name:'石块',   kind:'block', tile:T.STONE, col:'#8f8f96' },
  wood:  { name:'木材',   kind:'block', tile:T.WOOD,  col:'#a0723f' },
  torch: { name:'火把',   kind:'block', tile:T.TORCH, col:'#ffb13d' },
  bench: { name:'工作台', kind:'block', tile:T.BENCH, col:'#9c6b3f' },
  coal:  { name:'煤矿',   kind:'mat',   col:'#3a3a42' },
  iron:  { name:'铁矿',   kind:'mat',   col:'#c78a5e' },
  gold:  { name:'金矿',   kind:'mat',   col:'#f2c84b' },
  wood_pick:  { name:'木镐', kind:'pick', tier:1, speed:1.0, col:'#b98a55' },
  stone_pick: { name:'石镐', kind:'pick', tier:2, speed:1.6, col:'#9a9aa2' },
  iron_pick:  { name:'铁镐', kind:'pick', tier:3, speed:2.3, col:'#d8d8e0' },
  gold_pick:  { name:'金镐', kind:'pick', tier:4, speed:3.2, col:'#f2c84b' },
  wood_sword:  { name:'木剑', kind:'sword', dmg:7,  col:'#b98a55' },
  stone_sword: { name:'石剑', kind:'sword', dmg:12, col:'#9a9aa2' },
  iron_sword:  { name:'铁剑', kind:'sword', dmg:18, col:'#d8d8e0' },
  gold_sword:  { name:'金剑', kind:'sword', dmg:26, col:'#f2c84b' },
};

const RECIPES = [
  { out:'bench', n:1, req:{ wood:6 }, station:false },
  { out:'torch', n:4, req:{ wood:1 }, station:false },
  { out:'wood_pick',   n:1, req:{ wood:8 },              station:true },
  { out:'stone_pick',  n:1, req:{ wood:4, stone:12 },    station:true },
  { out:'iron_pick',   n:1, req:{ wood:4, iron:10 },     station:true },
  { out:'gold_pick',   n:1, req:{ wood:4, gold:10 },     station:true },
  { out:'wood_sword',  n:1, req:{ wood:8 },              station:true },
  { out:'stone_sword', n:1, req:{ wood:4, stone:12 },    station:true },
  { out:'iron_sword',  n:1, req:{ wood:4, iron:10 },     station:true },
  { out:'gold_sword',  n:1, req:{ wood:4, gold:10 },     station:true },
];

// ---------- 随机数 & 噪声 ----------
let SEED = 1337;
/**
 * 功能：根据整数位置和世界种子生成稳定的伪随机数。
 * 输入：整数位置 i。
 * 输出：0 到 1 之间的确定性随机数。
 */
function hash1(i) {
  let h = (Math.imul(i, 374761393) + Math.imul(SEED, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967295;
}
/**
 * 功能：根据二维格子坐标生成稳定的伪随机数。
 * 输入：格子坐标 x、y。
 * 输出：0 到 1 之间的确定性随机数。
 */
function hash2(x, y) { return hash1((Math.imul(x, 73856093) ^ Math.imul(y, 19349663)) | 0); }
/**
 * 功能：对插值比例执行平滑过渡。
 * 输入：0 到 1 的比例 t。
 * 输出：使用 smoothstep 曲线处理后的比例。
 */
function smooth(t) { return t * t * (3 - 2 * t); }
/**
 * 功能：生成一维平滑噪声。
 * 输入：连续坐标 x。
 * 输出：0 到 1 之间的平滑噪声值。
 */
function noise1(x) {
  const xi = Math.floor(x), f = x - xi;
  return hash1(xi) + (hash1(xi + 1) - hash1(xi)) * smooth(f);
}
/**
 * 功能：生成二维双线性平滑噪声。
 * 输入：连续坐标 x、y。
 * 输出：0 到 1 之间的二维平滑噪声值。
 */
function noise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  const u = smooth(fx), v = smooth(fy);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
/**
 * 功能：叠加多个一维噪声频率，得到自然地形高度。
 * 输入：连续坐标 x。
 * 输出：分形叠加后的地形噪声值。
 */
function fbm1(x) { return noise1(x) * 0.6 + noise1(x * 3.1 + 57) * 0.3 + noise1(x * 7.7 + 131) * 0.1; }
/**
 * 功能：叠加多个二维噪声频率，得到洞穴分布。
 * 输入：连续坐标 x、y。
 * 输出：分形叠加后的洞穴噪声值。
 */
function fbm2(x, y) { return noise2(x, y) * 0.65 + noise2(x * 2.3 + 31, y * 2.3 + 77) * 0.35; }

// ---------- 世界 ----------
const world = new Uint8Array(W * H);
const topSolid = new Int16Array(W);
const surf = new Int16Array(W);
const idx = (x, y) => y * W + x;
/**
 * 功能：读取指定格子的图块类型，越界时返回基岩。
 * 输入：格子坐标 x、y。
 * 输出：图块枚举值。
 */
function getT(x, y) { if (x < 0 || y < 0 || x >= W || y >= H) return T.BEDROCK; return world[idx(x, y)]; }
/**
 * 功能：写入指定格子的图块类型。
 * 输入：格子坐标 x、y 和新图块值 v。
 * 输出：无；越界时忽略。
 */
function setT(x, y, v) { if (x < 0 || y < 0 || x >= W || y >= H) return; world[idx(x, y)] = v; }
/**
 * 功能：判断指定格子是否参与实体碰撞。
 * 输入：格子坐标 x、y。
 * 输出：布尔值，实体图块返回 true。
 */
function isSolid(x, y) { return SOLID.has(getT(x, y)); }
/**
 * 功能：重新计算某一列最上方的实体图块高度。
 * 输入：世界列坐标 x。
 * 输出：无；更新列顶缓存 topSolid。
 */
function recomputeTopCol(x) {
  for (let y = 0; y < H; y++) if (SOLID.has(getT(x, y))) { topSolid[x] = y; return; }
  topSolid[x] = H;
}

/**
 * 功能：在合适深度随机游走并生成矿脉。
 * 输入：矿物图块、矿脉数量、深度和尺寸范围。
 * 输出：无；直接修改世界图块数组。
 */
function veins(t, count, minD, maxD, minS, maxS) {
  for (let i = 0; i < count; i++) {
    let x = 2 + Math.floor(hash1(i * 7 + t * 131) * (W - 4));
    const d = minD + hash1(i * 13 + t * 57) * (maxD - minD);
    let y = Math.min(H - 3, Math.floor(surf[x] + d));
    const size = minS + Math.floor(hash1(i * 29 + t * 91) * (maxS - minS + 1));
    for (let s = 0; s < size; s++) {
      if (getT(x, y) === T.STONE) setT(x, y, t);
      const r = hash1(i * 101 + s * 37 + t * 7);
      if (r < 0.3) x++; else if (r < 0.6) x--; else if (r < 0.8) y++; else y--;
      x = Math.max(1, Math.min(W - 2, x));
      y = Math.max(2, Math.min(H - 2, y));
    }
  }
}

/**
 * 功能：按种子生成地表、洞穴、矿脉、树木与列顶缓存。
 * 输入：32 位世界种子 seed。
 * 输出：无；重建完整世界数组。
 */
function genWorld(seed) {
  SEED = seed | 0;
  world.fill(T.AIR);
  const base = 42;
  for (let x = 0; x < W; x++) {
    const h = base + Math.round((fbm1(x * 0.035) - 0.5) * 22 + (fbm1(x * 0.008 + 9) - 0.5) * 14);
    surf[x] = h;
    for (let y = h; y < H; y++) {
      let t;
      if (y >= H - 1) t = T.BEDROCK;
      else if (y === h) t = T.GRASS;
      else if (y < h + 6) t = T.DIRT;
      else t = T.STONE;
      world[idx(x, y)] = t;
    }
  }
  for (let x = 0; x < W; x++) for (let y = surf[x] + 7; y < H - 1; y++) {
    if (fbm2(x * 0.07, y * 0.09) > 0.62) world[idx(x, y)] = T.AIR;
  }
  veins(T.COAL, 170, 8, 26, 3, 8);
  veins(T.IRON, 120, 18, 62, 3, 7);
  veins(T.GOLD, 70, 55, H - 4, 2, 6);
  let lastTree = -6;
  for (let x = 5; x < W - 5; x++) {
    if (getT(x, surf[x]) !== T.GRASS) continue;
    if (x - lastTree < 3) continue;
    if (hash1(x * 31 + 7) > 0.16) continue;
    lastTree = x;
    const th = 5 + Math.floor(hash1(x * 47) * 4);
    for (let i = 1; i <= th; i++) setT(x, surf[x] - i, T.TREE);
    const ly = surf[x] - th;
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 1; dy++) {
      if (dx === 0 && dy === 1) continue;
      if (Math.abs(dx) === 2 && dy === 1) continue;
      if (Math.abs(dx) === 2 && dy === -2) continue;
      if (getT(x + dx, ly + dy) === T.AIR) setT(x + dx, ly + dy, T.LEAF);
    }
  }
  for (let x = 0; x < W; x++) recomputeTopCol(x);
}

// ---------- 玩家 / 实体 ----------
const player = {
  x: 0, y: 0, w: 0.8, h: 1.8, vx: 0, vy: 0,
  onGround: false, blockX: false, face: 1,
  hp: 100, maxhp: 100, invuln: 0, lastHurt: -99,
  walkPhase: 0, action: 0, atkCd: 0, dead: false,
};
let zombies = [];
let particles = [];
let coins = 0;
let spawnX = 0, spawnY = 0;

let inv = new Array(30).fill(null);
let sel = 0;
/**
 * 功能：把物品加入背包并尽量合并同类堆叠。
 * 输入：物品 id 和可选数量 n，默认 1。
 * 输出：布尔值，全部放入时返回 true。
 */
function addItem(id, n) {
  n = n || 1;
  const it = ITEMS[id];
  const max = (it.kind === 'pick' || it.kind === 'sword') ? 1 : 99;
  for (let i = 0; i < 30 && n > 0; i++) {
    const s = inv[i];
    if (s && s.id === id && s.n < max) {
      const take = Math.min(max - s.n, n);
      s.n += take; n -= take;
    }
  }
  for (let i = 0; i < 30 && n > 0; i++) {
    if (!inv[i]) { inv[i] = { id, n }; n = 0; }
  }
  refreshInvPanel();
  return n === 0;
}
/**
 * 功能：统计背包中指定物品的总数量。
 * 输入：物品 id。
 * 输出：该物品总数量。
 */
function countItem(id) { let c = 0; for (const s of inv) if (s && s.id === id) c += s.n; return c; }
/**
 * 功能：从背包末尾开始扣除指定物品。
 * 输入：物品 id 和扣除数量 n。
 * 输出：无；数量不足时尽可能扣除。
 */
function removeItem(id, n) {
  for (let i = 29; i >= 0 && n > 0; i--) {
    const s = inv[i];
    if (s && s.id === id) { const t = Math.min(s.n, n); s.n -= t; n -= t; if (s.n <= 0) inv[i] = null; }
  }
  refreshInvPanel();
}

// ---------- 时间 ----------
let gameTime = 0, dayCount = 1, zspawnT = 2;
/**
 * 功能：计算当前昼夜周期内的位置。
 * 输入：无。
 * 输出：0 到昼夜总长度之间的秒数。
 */
function cyclePos() { return gameTime % (DAY_LEN + NIGHT_LEN); }
/**
 * 功能：根据昼夜周期计算天空光照强度。
 * 输入：无。
 * 输出：0.12 到 1 之间的亮度。
 */
function skyBrightness() {
  const t = cyclePos(), tr = 14;
  if (t < DAY_LEN - tr) return 1;
  if (t < DAY_LEN) return 1 + (0.12 - 1) * ((t - (DAY_LEN - tr)) / tr);
  const nt = t - DAY_LEN;
  if (nt < NIGHT_LEN - tr) return 0.12;
  return 0.12 + (1 - 0.12) * ((nt - (NIGHT_LEN - tr)) / tr);
}
/**
 * 功能：判断当前是否属于需要生成僵尸的夜晚。
 * 输入：无。
 * 输出：布尔值，亮度低于阈值时为 true。
 */
function isNight() { return skyBrightness() < 0.4; }

// ---------- 物理 ----------
/**
 * 功能：检测矩形实体是否与实体图块网格重叠。
 * 输入：实体位置 x、y 与宽高 w、h。
 * 输出：布尔值，发生碰撞时为 true。
 */
function collides(x, y, w, h) {
  const x0 = Math.floor(x), x1 = Math.floor(x + w - 0.001);
  const y0 = Math.floor(y), y1 = Math.floor(y + h - 0.001);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++)
    if (isSolid(tx, ty)) return true;
  return false;
}
/**
 * 功能：为实体施加重力并按 X、Y 分轴解算碰撞。
 * 输入：实体 e 和更新时间 dt。
 * 输出：无；更新实体位置、速度与落地状态。
 */
function moveEntity(e, dt) {
  e.vy = Math.min(MAXFALL, e.vy + GRAV * dt);
  let nx = e.x + e.vx * dt;
  e.blockX = false;
  if (e.vx > 0) {
    if (collides(nx, e.y, e.w, e.h)) { nx = Math.floor(nx + e.w) - e.w - 0.001; e.blockX = true; e.vx = 0; }
  } else if (e.vx < 0) {
    if (collides(nx, e.y, e.w, e.h)) { nx = Math.floor(nx) + 1.001; e.blockX = true; e.vx = 0; }
  }
  e.x = nx;
  let ny = e.y + e.vy * dt;
  e.onGround = false;
  if (e.vy > 0) {
    if (collides(nx, ny, e.w, e.h)) { ny = Math.floor(ny + e.h) - e.h - 0.001; e.vy = 0; e.onGround = true; }
  } else if (e.vy < 0) {
    if (collides(nx, ny, e.w, e.h)) { ny = Math.floor(ny) + 1.001; e.vy = 0; }
  }
  e.y = ny;
  if (e.x < 0.2) e.x = 0.2;
  if (e.x > W - e.w - 0.2) e.x = W - e.w - 0.2;
}
/**
 * 功能：检测两个轴对齐矩形是否相交。
 * 输入：两个带 x、y、w、h 的矩形。
 * 输出：布尔值，相交时为 true。
 */
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// ---------- 粒子 ----------
/**
 * 功能：生成一组粒子爆发效果。
 * 输入：世界坐标、颜色、粒子数量和扩散范围。
 * 输出：无；粒子被追加到活动粒子数组。
 */
function burst(x, y, color, n, spread) {
  spread = spread || 5;
  for (let i = 0; i < n; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * spread,
      vy: -Math.random() * spread * 0.8 - 1,
      life: 0.5 + Math.random() * 0.5, t: 0,
      color, size: 2 + Math.random() * 3,
    });
  }
  if (particles.length > 400) particles.splice(0, particles.length - 400);
}
/**
 * 功能：推进粒子运动并删除过期粒子。
 * 输入：更新时间 dt。
 * 输出：无；更新粒子数组。
 */
function updateParticles(dt) {
  for (const p of particles) {
    p.t += dt;
    p.vy += 22 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  particles = particles.filter(p => p.t < p.life);
}

// ---------- 音效 ----------
let AC = null;
/**
 * 功能：使用 Web Audio 生成无需音频文件的短音效。
 * 输入：音效类型字符串 type。
 * 输出：无；音频不可用时静默失败。
 */
function sfx(type) {
  try {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    const o = AC.createOscillator(), g = AC.createGain();
    o.connect(g); g.connect(AC.destination);
    const t0 = AC.currentTime;
    let f0 = 440, f1 = 220, dur = 0.08, vol = 0.06, wave = 'square';
    switch (type) {
      case 'dig':   f0 = 180 + Math.random() * 60; f1 = 90;  dur = 0.05; vol = 0.04; break;
      case 'break': f0 = 320; f1 = 60;  dur = 0.12; vol = 0.08; break;
      case 'place': f0 = 240; f1 = 180; dur = 0.06; vol = 0.06; break;
      case 'jump':  f0 = 300; f1 = 520; dur = 0.09; vol = 0.03; wave = 'sine'; break;
      case 'hurt':  f0 = 200; f1 = 70;  dur = 0.18; vol = 0.10; wave = 'sawtooth'; break;
      case 'zhit':  f0 = 260; f1 = 120; dur = 0.08; vol = 0.07; break;
      case 'zdie':  f0 = 160; f1 = 40;  dur = 0.25; vol = 0.09; wave = 'sawtooth'; break;
      case 'swing': f0 = 500; f1 = 240; dur = 0.05; vol = 0.025; wave = 'sine'; break;
      case 'craft': f0 = 520; f1 = 780; dur = 0.12; vol = 0.06; wave = 'triangle'; break;
      case 'heart': f0 = 660; f1 = 990; dur = 0.15; vol = 0.06; wave = 'triangle'; break;
    }
    o.type = wave;
    o.frequency.setValueAtTime(f0, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.start(t0); o.stop(t0 + dur + 0.02);
  } catch (e) { /* 忽略音频错误 */ }
}

// ---------- 输入 ----------
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const keys = {};
const mouse = { x: 0, y: 0, down: false };
let panelOpen = false;
let started = false;

/**
 * 功能：让 Canvas 尺寸跟随浏览器视口。
 * 输入：无。
 * 输出：无；更新 Canvas 宽高。
 */
function resize() {
  canvas.width = Math.floor(innerWidth);
  canvas.height = Math.floor(innerHeight);
}
addEventListener('resize', resize);
resize();

addEventListener('keydown', e => {
  keys[e.code] = true;
  if (!started) return;
  if (e.code === 'Tab') e.preventDefault();
  if (e.code === 'KeyE' || e.code === 'Tab') togglePanel();
  if (e.code === 'KeyH') toggleHelp();
  if (e.code.startsWith('Digit')) {
    const d = parseInt(e.code.slice(5), 10);
    sel = d === 0 ? 9 : d - 1;
    showSelName();
  }
});
addEventListener('keyup', e => { keys[e.code] = false; });
canvas.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
canvas.addEventListener('mousedown', e => {
  if (e.button !== 0) return;
  if (handleUIClick(e.clientX, e.clientY)) return;
  mouse.down = true;
});
addEventListener('mouseup', () => { mouse.down = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());
addEventListener('wheel', e => {
  if (!started || panelOpen) return;
  sel = (sel + (e.deltaY > 0 ? 1 : -1) + 10) % 10;
  showSelName();
}, { passive: true });

// ---------- 提示 ----------
const toastEl = document.getElementById('toast');
let toastTimer = 0;
let lastHint = '', lastHintT = -99;
/**
 * 功能：在顶部显示短消息并自动淡出。
 * 输入：要显示的文本 msg。
 * 输出：无；更新提示元素和计时器。
 */
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.style.opacity = '1';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.style.opacity = '0'; }, 2200);
}
/**
 * 功能：对重复提示做节流后显示给玩家。
 * 输入：提示文本 msg。
 * 输出：无；同一提示四秒内只显示一次。
 */
function hint(msg) {
  if (msg === lastHint && gameTime - lastHintT < 4) return;
  lastHint = msg; lastHintT = gameTime;
  toast(msg);
}
let selNameT = -9;
/**
 * 功能：显示当前快捷栏物品名称。
 * 输入：无。
 * 输出：无；更新提示和名称显示时间。
 */
function showSelName() {
  const s = inv[sel];
  if (s) { toast(ITEMS[s.id].name); selNameT = gameTime; }
}

// ---------- 挖掘 / 放置 / 攻击 ----------
let mineTarget = -1, mineProg = 0;
/**
 * 功能：把屏幕鼠标位置转换为世界格子坐标。
 * 输入：无，读取当前鼠标与相机状态。
 * 输出：包含世界坐标 x、y 的对象。
 */
function mouseWorld() {
  return {
    x: (mouse.x / ZOOM + cam.x) / TILE,
    y: (mouse.y / ZOOM + cam.y) / TILE,
  };
}

/**
 * 功能：根据鼠标按键和手持物执行挖掘、放置或攻击。
 * 输入：更新时间 dt。
 * 输出：无；更新挖掘进度并触发对应游戏行为。
 */
function handleMouse(dt) {
  const held = inv[sel] ? ITEMS[inv[sel].id] : null;
  if (!mouse.down || panelOpen || player.dead) { mineProg = 0; mineTarget = -1; return; }
  const mw = mouseWorld();
  const tx = Math.floor(mw.x), ty = Math.floor(mw.y);
  const pcx = player.x + player.w / 2, pcy = player.y + player.h / 2;
  const dist = Math.hypot(tx + 0.5 - pcx, ty + 0.5 - pcy);
  player.face = (mw.x >= pcx) ? 1 : -1;
  if (dist > REACH) { mineProg = 0; mineTarget = -1; return; }
  const t = getT(tx, ty);

  if (held && held.kind === 'sword' && (t === T.AIR || t === T.LEAF)) {
    if (player.atkCd <= 0) { attack(held); player.atkCd = 0.36; }
    return;
  }
  if (t !== T.AIR) {
    const info = TILEINFO[t];
    if (!info || info.hard === Infinity) { mineProg = 0; return; }
    const isPick = held && held.kind === 'pick';
    if (!info.anyTool && !isPick) { hint('需要一把镐来挖掘(按 E 打开合成)'); mineProg = 0; return; }
    const tier = isPick ? held.tier : 0;
    if (tier < info.tier) {
      hint(info.tier === 1 ? '至少需要一把木镐' : info.tier === 2 ? '需要石镐或更好的镐' : '需要铁镐或更好的镐');
      mineProg = 0; return;
    }
    const k = idx(tx, ty);
    if (k !== mineTarget) { mineTarget = k; mineProg = 0; }
    const speed = isPick ? held.speed : 1;
    mineProg += dt * speed / info.hard;
    player.action = 0.18;
    if (Math.random() < dt * 10) {
      sfx('dig');
      burst(tx + 0.5, ty + 0.5, tileColor(t), 2, 3);
    }
    if (mineProg >= 1) { breakTile(tx, ty, t); mineProg = 0; mineTarget = -1; }
  } else if (held && held.kind === 'block') {
    placeBlock(tx, ty, inv[sel].id);
  } else {
    mineProg = 0; mineTarget = -1;
  }
}

/**
 * 功能：破坏图块、掉落物品并生成粒子。
 * 输入：格子坐标 tx、ty 和原图块类型 t。
 * 输出：无；修改世界、背包和粒子。
 */
function breakTile(tx, ty, t) {
  setT(tx, ty, T.AIR);
  recomputeTopCol(tx);
  const info = TILEINFO[t];
  if (info.drop) {
    let n = 1;
    if (t === T.TREE) n = hash2(tx, ty) < 0.5 ? 2 : 1;
    addItem(info.drop, n);
    toast('获得 ' + ITEMS[info.drop].name + (n > 1 ? ' ×' + n : ''));
  }
  burst(tx + 0.5, ty + 0.5, tileColor(t), 12, 6);
  sfx('break');
}

/**
 * 功能：在鼠标目标格放置当前背包方块。
 * 输入：目标格子 tx、ty 和物品 id。
 * 输出：无；合法时消耗物品并写入世界。
 */
function placeBlock(tx, ty, id) {
  if (getT(tx, ty) !== T.AIR) return;
  const it = ITEMS[id];
  if (SOLID.has(it.tile) && rectsOverlap({ x: tx, y: ty, w: 1, h: 1 }, player)) return;
  // 需与已有方块相邻(防止凭空悬空放置体验过差?——泰拉瑞亚允许任意放置,这里放宽:仅检查背包数量)
  const s = inv[sel];
  if (!s || s.id !== id) return;
  setT(tx, ty, it.tile);
  if (SOLID.has(it.tile) && ty < topSolid[tx]) topSolid[tx] = ty;
  removeItem(id, 1);
  player.action = 0.15;
  sfx('place');
}

/**
 * 功能：对玩家前方的僵尸造成剑伤害与击退。
 * 输入：当前武器物品 item。
 * 输出：无；更新僵尸生命、速度和粒子。
 */
function attack(item) {
  sfx('swing');
  player.action = 0.22;
  const pcx = player.x + player.w / 2, pcy = player.y + player.h / 2;
  for (const z of zombies) {
    if (z.hp <= 0) continue;
    const zx = z.x + z.w / 2, zy = z.y + z.h / 2;
    const d = Math.hypot(zx - pcx, zy - pcy);
    const inFront = Math.sign(zx - pcx) === player.face || Math.abs(zx - pcx) < 0.6;
    if (d < 2.7 && inFront) {
      z.hp -= item.dmg;
      z.hurtT = 0.3;
      z.vx = player.face * 9;
      z.vy = -6;
      burst(zx, zy, '#7fae4c', 8, 5);
      sfx('zhit');
      if (z.hp <= 0) killZombie(z);
    }
  }
}

/**
 * 功能：结算僵尸死亡、金币和生命之心掉落。
 * 输入：死亡僵尸对象 z。
 * 输出：无；更新金币、生命和粒子。
 */
function killZombie(z) {
  z.hp = 0;
  burst(z.x + z.w / 2, z.y + z.h / 2, '#5d8f3e', 18, 7);
  coins += 1 + Math.floor(Math.random() * 4);
  sfx('zdie');
  if (Math.random() < 0.3) {
    player.hp = Math.min(player.maxhp, player.hp + 20);
    toast('拾取生命之心 +20 HP');
    sfx('heart');
  }
}

/**
 * 功能：对玩家造成伤害、击退和无敌时间。
 * 输入：伤害值 dmg 与击退方向 dir。
 * 输出：无；生命归零时显示死亡面板。
 */
function hurtPlayer(dmg, dir) {
  player.hp -= dmg;
  player.invuln = 1;
  player.lastHurt = gameTime;
  player.vx = dir * 7;
  player.vy = -8;
  burst(player.x + player.w / 2, player.y + player.h / 2, '#c0392b', 10, 5);
  sfx('hurt');
  if (player.hp <= 0) {
    player.hp = 0;
    player.dead = true;
    document.getElementById('deathInfo').textContent =
      '你在第 ' + dayCount + ' 天被僵尸撕碎了 · 金币 ' + coins;
    document.getElementById('deathPanel').classList.remove('hidden');
  }
}

// ---------- 僵尸 ----------
/**
 * 功能：在夜晚屏幕外寻找地表并生成僵尸。
 * 输入：无。
 * 输出：无；僵尸加入活动数组，无法落脚时忽略。
 */
function spawnZombie() {
  const dir = Math.random() < 0.5 ? -1 : 1;
  const x = Math.floor(player.x + dir * (22 + Math.random() * 14));
  if (x < 3 || x > W - 4) return;
  const gy = topSolid[x];
  if (gy >= H - 2) return;
  const hp = 26 + dayCount * 4;
  zombies.push({
    x: x + 0.1, y: gy - 1.9 - 0.01, w: 0.8, h: 1.9, vx: 0, vy: 0,
    hp, maxhp: hp, face: -dir, hurtT: 0, walkPhase: Math.random() * 6,
    onGround: false, blockX: false,
  });
}

/**
 * 功能：控制夜间生成、僵尸追踪和天亮燃烧。
 * 输入：更新时间 dt。
 * 输出：无；更新僵尸数组和玩家状态。
 */
function updateZombies(dt) {
  const night = isNight();
  if (!night) {
    if (zombies.length) {
      for (const z of zombies) burst(z.x + 0.4, z.y + 1, '#ff9a3d', 10, 4);
      zombies.length = 0;
    }
  } else {
    zspawnT -= dt;
    const cap = Math.min(10, 3 + dayCount);
    if (zspawnT <= 0 && zombies.length < cap && !player.dead) {
      spawnZombie();
      zspawnT = 2.8 + Math.random() * 1.5;
    }
  }
  for (const z of zombies) {
    if (z.hp <= 0) continue;
    const dx = (player.x + player.w / 2) - (z.x + z.w / 2);
    const dy = player.y - z.y;
    const adx = Math.abs(dx);
    if (adx < 30 && !player.dead) {
      z.vx = Math.sign(dx) * Math.min(3.2, 1.7 + dayCount * 0.12);
      z.face = Math.sign(dx) || 1;
      z.walkPhase += dt * 9;
    } else z.vx = 0;
    if (z.blockX && z.onGround) z.vy = -15.5;
    if (dy < -2.5 && z.onGround && adx < 9 && Math.random() < 0.03) z.vy = -15.5;
    moveEntity(z, dt);
    z.hurtT = Math.max(0, z.hurtT - dt);
    if (!player.dead && player.invuln <= 0 && rectsOverlap(player, z)) {
      hurtPlayer(10 + Math.min(10, dayCount * 2), Math.sign(player.x - z.x) || 1);
    }
  }
  zombies = zombies.filter(z => z.hp > 0);
}

// ---------- 主更新 ----------
/**
 * 功能：推进时间、玩家输入、物理、鼠标动作和敌人 AI。
 * 输入：固定时间步 dt。
 * 输出：无；更新完整游戏状态。
 */
function update(dt) {
  gameTime += dt;
  const d = Math.floor(gameTime / (DAY_LEN + NIGHT_LEN)) + 1;
  if (d !== dayCount) { dayCount = d; toast('☀ 第 ' + d + ' 天'); }

  if (!player.dead) {
    let mx = 0;
    if (keys['KeyA'] || keys['ArrowLeft']) mx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) mx += 1;
    player.vx = mx * 5.4;
    if (mx !== 0) { player.face = mx; player.walkPhase += dt * 11; }
    if ((keys['Space'] || keys['KeyW'] || keys['ArrowUp']) && player.onGround) {
      player.vy = -18.5;
      sfx('jump');
    }
    player.atkCd = Math.max(0, player.atkCd - dt);
    player.invuln = Math.max(0, player.invuln - dt);
    player.action = Math.max(0, player.action - dt);
    moveEntity(player, dt);
    if (gameTime - player.lastHurt > 10 && player.hp < player.maxhp) {
      player.hp = Math.min(player.maxhp, player.hp + dt * 1.6);
    }
    handleMouse(dt);
  }
  updateZombies(dt);
  updateParticles(dt);
}

// ---------- 渲染 ----------
const cam = { x: 0, y: 0 };
const clouds = [];
for (let i = 0; i < 14; i++) {
  clouds.push({ x: Math.random() * 4000, y: 30 + Math.random() * 180, s: 0.6 + Math.random() * 1.4, v: 3 + Math.random() * 5 });
}
const stars = [];
for (let i = 0; i < 90; i++) {
  stars.push({ x: Math.random(), y: Math.random() * 0.55, tw: Math.random() * 6.28 });
}

/**
 * 功能：按比例混合两个十六进制颜色。
 * 输入：起始颜色、结束颜色和比例 t。
 * 输出：CSS rgb 颜色字符串。
 */
function mixCol(c1, c2, t) {
  const a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
  const r = Math.round(((a >> 16) & 255) + (((b >> 16) & 255) - ((a >> 16) & 255)) * t);
  const g = Math.round(((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * t);
  const bl = Math.round((a & 255) + ((b & 255) - (a & 255)) * t);
  return 'rgb(' + r + ',' + g + ',' + bl + ')';
}

/**
 * 功能：返回图块对应的主色。
 * 输入：图块类型 t。
 * 输出：十六进制颜色字符串。
 */
function tileColor(t) {
  switch (t) {
    case T.GRASS: return '#4f9e3f';
    case T.DIRT: return '#8a5a35';
    case T.STONE: return '#8a8a90';
    case T.COAL: return '#3a3a42';
    case T.IRON: return '#c78a5e';
    case T.GOLD: return '#f2c84b';
    case T.TREE: return '#7a4f2a';
    case T.LEAF: return '#3f7d33';
    case T.WOOD: return '#a0723f';
    case T.TORCH: return '#ffb13d';
    case T.BENCH: return '#9c6b3f';
    default: return '#444';
  }
}

/**
 * 功能：绘制天空渐变、星空、日月和云层。
 * 输入：当前夜晚亮度 b。
 * 输出：无；直接绘制到 Canvas。
 */
function drawSky(b) {
  const cw = canvas.width, ch = canvas.height;
  const top = mixCol('#0a1030', '#4d9be6', b);
  const bot = mixCol('#1b2350', '#aee2f5', b);
  const g = ctx.createLinearGradient(0, 0, 0, ch);
  g.addColorStop(0, top);
  g.addColorStop(1, bot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cw, ch);

  // 星星
  if (b < 0.5) {
    const a = (0.5 - b) * 2;
    for (const s of stars) {
      const tw = 0.5 + 0.5 * Math.sin(gameTime * 2 + s.tw);
      ctx.fillStyle = 'rgba(255,255,255,' + (a * tw * 0.9).toFixed(2) + ')';
      ctx.fillRect(s.x * cw, s.y * ch, 2, 2);
    }
  }
  // 太阳 / 月亮
  const cp = cyclePos();
  if (cp < DAY_LEN) {
    const f = cp / DAY_LEN;
    const sx = cw * (0.08 + 0.84 * f);
    const sy = ch * 0.72 - Math.sin(Math.PI * f) * ch * 0.55;
    ctx.fillStyle = '#ffd75e';
    ctx.beginPath(); ctx.arc(sx, sy, 26, 0, 6.29); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,180,0.35)';
    ctx.beginPath(); ctx.arc(sx, sy, 40, 0, 6.29); ctx.fill();
  } else {
    const f = (cp - DAY_LEN) / NIGHT_LEN;
    const sx = cw * (0.08 + 0.84 * f);
    const sy = ch * 0.72 - Math.sin(Math.PI * f) * ch * 0.5;
    ctx.fillStyle = '#e8e8f0';
    ctx.beginPath(); ctx.arc(sx, sy, 20, 0, 6.29); ctx.fill();
    ctx.fillStyle = '#b8b8cc';
    ctx.beginPath(); ctx.arc(sx - 6, sy - 4, 4, 0, 6.29); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + 5, sy + 6, 3, 0, 6.29); ctx.fill();
  }
  // 云
  for (const c of clouds) {
    c.x += c.v * 0.016;
    const sx = (c.x - cam.x * 0.25) % (cw + 400);
    const x = sx < -200 ? sx + cw + 400 : sx;
    ctx.fillStyle = 'rgba(255,255,255,' + (0.12 + 0.35 * b).toFixed(2) + ')';
    ctx.beginPath();
    ctx.ellipse(x, c.y, 46 * c.s, 13 * c.s, 0, 0, 6.29);
    ctx.ellipse(x + 30 * c.s, c.y + 6 * c.s, 30 * c.s, 10 * c.s, 0, 0, 6.29);
    ctx.ellipse(x - 32 * c.s, c.y + 7 * c.s, 26 * c.s, 9 * c.s, 0, 0, 6.29);
    ctx.fill();
  }
}

/**
 * 功能：绘制带视差效果的一层远景山体。
 * 输入：亮度、视差、昼夜颜色、基线、振幅和偏移。
 * 输出：无；直接绘制到 Canvas。
 */
function drawHillLayer(b, par, day, night, baseY, amp, off) {
  const cw = canvas.width, ch = canvas.height;
  ctx.fillStyle = mixCol(night, day, b);
  ctx.beginPath();
  ctx.moveTo(-4, ch);
  for (let sx = -4; sx <= cw + 12; sx += 12) {
    const wx = cam.x * par + sx / ZOOM;
    const h = fbm1(wx * 0.006 + off);
    ctx.lineTo(sx, baseY - h * amp);
  }
  ctx.lineTo(cw + 12, ch);
  ctx.closePath();
  ctx.fill();
}

/**
 * 功能：按图块类型绘制程序化像素纹理。
 * 输入：格子坐标 tx、ty 和图块类型 t。
 * 输出：无；直接绘制到 Canvas。
 */
function drawTile(tx, ty, t) {
  const x = tx * TILE, y = ty * TILE;
  const h1 = hash2(tx * 3 + 11, ty * 5 + 7);
  const h2 = hash2(tx * 7 + 3, ty * 13 + 1);
  switch (t) {
    case T.GRASS:
    case T.DIRT: {
      ctx.fillStyle = h1 < 0.5 ? '#8a5a35' : '#835631';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#754a2c';
      ctx.fillRect(x + 2 + Math.floor(h1 * 8), y + 6 + Math.floor(h2 * 6), 3, 2);
      ctx.fillRect(x + 9 + Math.floor(h2 * 4), y + 10, 2, 2);
      ctx.fillStyle = '#9d6b41';
      ctx.fillRect(x + 4 + Math.floor(h2 * 6), y + 3 + Math.floor(h1 * 4), 2, 2);
      if (t === T.GRASS) {
        ctx.fillStyle = h2 < 0.5 ? '#4f9e3f' : '#4a9839';
        ctx.fillRect(x, y, TILE, 5);
        ctx.fillStyle = '#63b64e';
        ctx.fillRect(x, y, TILE, 2);
        if (h1 < 0.4) { ctx.fillStyle = '#63b64e'; ctx.fillRect(x + Math.floor(h2 * 12), y - 2, 1, 2); }
      }
      break;
    }
    case T.STONE:
    case T.COAL:
    case T.IRON:
    case T.GOLD: {
      ctx.fillStyle = h1 < 0.5 ? '#8a8a90' : '#84848b';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#74747c';
      ctx.fillRect(x + 2 + Math.floor(h1 * 9), y + 3 + Math.floor(h2 * 8), 3, 3);
      ctx.fillRect(x + 10, y + 10 + Math.floor(h1 * 3), 2, 2);
      if (t !== T.STONE) {
        const oc = t === T.COAL ? '#2b2b31' : t === T.IRON ? '#d28a5c' : '#f2c84b';
        ctx.fillStyle = oc;
        ctx.fillRect(x + 3 + Math.floor(h1 * 6), y + 3 + Math.floor(h2 * 5), 3, 3);
        ctx.fillRect(x + 9 + Math.floor(h2 * 4), y + 8 + Math.floor(h1 * 5), 3, 2);
        ctx.fillRect(x + 5, y + 11, 2, 2);
      }
      break;
    }
    case T.TREE:
      ctx.fillStyle = '#7a4f2a';
      ctx.fillRect(x + 3, y, TILE - 6, TILE);
      ctx.fillStyle = '#66401f';
      ctx.fillRect(x + 3, y, 3, TILE);
      ctx.fillStyle = '#8d5f34';
      if (h1 < 0.6) ctx.fillRect(x + 8, y + Math.floor(h2 * 10), 2, 4);
      break;
    case T.LEAF:
      ctx.fillStyle = h1 < 0.5 ? '#3f7d33' : '#3a752f';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#356b2b';
      ctx.fillRect(x + Math.floor(h1 * 10), y + Math.floor(h2 * 10), 4, 4);
      ctx.fillStyle = '#4d9140';
      ctx.fillRect(x + Math.floor(h2 * 10), y + Math.floor(h1 * 10), 3, 3);
      break;
    case T.WOOD:
      ctx.fillStyle = '#a0723f';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#8a5f33';
      ctx.fillRect(x, y + 5, TILE, 2);
      ctx.fillRect(x, y + 12, TILE, 2);
      if (h1 < 0.5) ctx.fillRect(x + 6, y, 2, 5);
      break;
    case T.TORCH: {
      ctx.fillStyle = '#8a5f33';
      ctx.fillRect(x + 6, y + 7, 4, 9);
      const fl = Math.sin(gameTime * 11 + tx * 3 + ty) * 1.5;
      ctx.fillStyle = '#ff8c2e';
      ctx.fillRect(x + 5, y + 2 + fl * 0.4, 6, 6);
      ctx.fillStyle = '#ffd75e';
      ctx.fillRect(x + 6.5, y + 3.5 + fl * 0.4, 3, 3);
      break;
    }
    case T.BENCH:
      ctx.fillStyle = '#9c6b3f';
      ctx.fillRect(x, y + 4, TILE, 4);
      ctx.fillStyle = '#7a5228';
      ctx.fillRect(x + 2, y + 8, 3, 8);
      ctx.fillRect(x + 11, y + 8, 3, 8);
      ctx.fillStyle = '#b9854f';
      ctx.fillRect(x, y + 4, TILE, 1.5);
      break;
    case T.BEDROCK:
      ctx.fillStyle = h1 < 0.5 ? '#3a3a40' : '#34343a';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#2a2a30';
      ctx.fillRect(x + Math.floor(h1 * 10), y + Math.floor(h2 * 10), 5, 4);
      break;
  }
}

// ---------- 角色绘制 ----------
/**
 * 功能：用矩形拼装玩家或僵尸的像素角色。
 * 输入：位置、尺寸和外观选项 opt。
 * 输出：无；直接绘制到 Canvas。
 */
function drawHumanoid(x, y, w, h, opt) {
  const px = x * TILE, py = y * TILE;
  const legSwing = opt.moving ? Math.sin(opt.phase) * 3.5 : 0;
  // 腿
  ctx.fillStyle = opt.pants;
  ctx.fillRect(px + 2, py + h * TILE - 9, 4, 9 + legSwing * 0.4);
  ctx.fillRect(px + w * TILE - 6, py + h * TILE - 9, 4, 9 - legSwing * 0.4);
  // 身体
  ctx.fillStyle = opt.shirt;
  ctx.fillRect(px + 1, py + 11, w * TILE - 2, h * TILE - 20);
  // 手臂(僵尸前伸)
  ctx.fillStyle = opt.skin;
  if (opt.zombie) {
    ctx.fillRect(px + (opt.face > 0 ? w * TILE - 1 : -6), py + 13, 7, 3);
  } else {
    ctx.fillRect(px - 1, py + 12, 3, 8);
    ctx.fillRect(px + w * TILE - 2, py + 12, 3, 8);
  }
  // 头
  ctx.fillStyle = opt.skin;
  ctx.fillRect(px + 1.5, py, w * TILE - 3, 10);
  // 头发 / 眼睛
  if (opt.zombie) {
    ctx.fillStyle = '#3a5a28';
    ctx.fillRect(px + 1.5, py, w * TILE - 3, 3);
    ctx.fillStyle = '#ff4040';
    ctx.fillRect(px + (opt.face > 0 ? w * TILE - 5 : 3), py + 5, 2, 2);
  } else {
    ctx.fillStyle = '#5a3a1e';
    ctx.fillRect(px + 1.5, py, w * TILE - 3, 3.5);
    ctx.fillStyle = '#222';
    ctx.fillRect(px + (opt.face > 0 ? w * TILE - 5.5 : 3.5), py + 5, 2, 2.5);
  }
}

/**
 * 功能：绘制玩家当前持有的镐或剑与挥动动作。
 * 输入：无。
 * 输出：无；直接绘制到 Canvas。
 */
function drawHeldItem() {
  const held = inv[sel];
  if (!held) return;
  const it = ITEMS[held.id];
  if (it.kind !== 'pick' && it.kind !== 'sword') return;
  const px = (player.x + player.w / 2) * TILE;
  const py = (player.y + 0.75) * TILE;
  const swing = player.action > 0 ? -1.2 + (0.22 - player.action) * 8 : 0.5;
  ctx.save();
  ctx.translate(px, py);
  ctx.scale(player.face, 1);
  ctx.rotate(swing);
  ctx.strokeStyle = it.col;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(10, -6);
  ctx.stroke();
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  if (it.kind === 'pick') { ctx.moveTo(6, -9); ctx.lineTo(14, -3); }
  else { ctx.moveTo(10, -6); ctx.lineTo(15, -11); }
  ctx.stroke();
  ctx.restore();
}

/**
 * 功能：绘制僵尸、玩家、血条和受击闪烁。
 * 输入：无。
 * 输出：无；直接绘制到 Canvas。
 */
function drawEntities() {
  for (const z of zombies) {
    if (z.hurtT > 0 && Math.floor(gameTime * 20) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }
    drawHumanoid(z.x, z.y, z.w, z.h, {
      skin: '#7fae4c', shirt: '#3f5a8a', pants: '#5a3a2a',
      face: z.face, phase: z.walkPhase, moving: Math.abs(z.vx) > 0.1, zombie: true,
    });
    ctx.globalAlpha = 1;
    if (z.hp < z.maxhp) {
      const zx = z.x * TILE - 3, zy = z.y * TILE - 8;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(zx, zy, 22, 4);
      ctx.fillStyle = '#d84040';
      ctx.fillRect(zx + 1, zy + 1, 20 * Math.max(0, z.hp / z.maxhp), 2);
    }
  }
  if (!player.dead) {
    const blink = player.invuln > 0 && Math.floor(gameTime * 12) % 2 === 0;
    if (!blink) {
      drawHumanoid(player.x, player.y, player.w, player.h, {
        skin: '#e8b98a', shirt: '#3a6ea8', pants: '#2c4a78',
        face: player.face, phase: player.walkPhase,
        moving: Math.abs(player.vx) > 0.1 && player.onGround, zombie: false,
      });
      drawHeldItem();
    }
  }
}

/**
 * 功能：绘制剩余粒子及其透明度。
 * 输入：无。
 * 输出：无；直接绘制到 Canvas。
 */
function drawParticles() {
  for (const p of particles) {
    const a = 1 - p.t / p.life;
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x * TILE - p.size / 2, p.y * TILE - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

// ---------- 光照 ----------
const lightMap = new Float32Array(4096);
/**
 * 功能：计算天空光、火把光和玩家微光并绘制遮罩。
 * 输入：亮度 b 与可见格子范围。
 * 输出：无；直接绘制到 Canvas。
 */
function drawDarkness(b, x0, y0, x1, y1) {
  const rw = x1 - x0 + 1, rh = y1 - y0 + 1;
  if (rw * rh > lightMap.length) return;
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const i = (ty - y0) * rw + (tx - x0);
      lightMap[i] = ty < topSolid[tx] ? b : 0;
    }
  }
  // 火把光晕
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (getT(tx, ty) !== T.TORCH) continue;
      const R = 8;
      for (let dy = -R; dy <= R; dy++) {
        for (let dx = -R; dx <= R; dx++) {
          const gx = tx + dx, gy = ty + dy;
          if (gx < x0 || gx > x1 || gy < y0 || gy > y1) continue;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d > R) continue;
          const v = (1 - d / R) * 1.05;
          const i = (gy - y0) * rw + (gx - x0);
          if (v > lightMap[i]) lightMap[i] = v;
        }
      }
    }
  }
  // 玩家微光
  const pcx = Math.floor(player.x), pcy = Math.floor(player.y);
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
    const gx = pcx + dx, gy = pcy + dy;
    if (gx < x0 || gx > x1 || gy < y0 || gy > y1) continue;
    const d = Math.sqrt(dx * dx + dy * dy);
    const v = Math.max(0, 0.34 - d * 0.09);
    const i = (gy - y0) * rw + (gx - x0);
    if (v > lightMap[i]) lightMap[i] = v;
  }
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const L = Math.min(1, lightMap[(ty - y0) * rw + (tx - x0)]);
      const a = (1 - L) * 0.93;
      if (a > 0.02) {
        ctx.fillStyle = 'rgba(3,5,16,' + a.toFixed(3) + ')';
        ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
      }
    }
  }
}

// ---------- 主渲染 ----------
/**
 * 功能：更新相机并渲染天空、世界、实体、粒子、光照与 HUD。
 * 输入：无。
 * 输出：无；绘制完整游戏帧。
 */
function render() {
  const cw = canvas.width, ch = canvas.height;
  const pcx = (player.x + player.w / 2) * TILE, pcy = (player.y + player.h / 2) * TILE;
  cam.x += (pcx - cw / ZOOM / 2 - cam.x) * 0.12;
  cam.y += (pcy - ch / ZOOM / 2 - cam.y) * 0.12;
  cam.x = Math.max(0, Math.min(W * TILE - cw / ZOOM, cam.x));
  cam.y = Math.max(0, Math.min(H * TILE - ch / ZOOM, cam.y));
  const b = skyBrightness();

  drawSky(b);
  drawHillLayer(b, 0.3, '#315c3f', '#0a1220', ch * 0.75, 120, 300);
  drawHillLayer(b, 0.55, '#3c7a46', '#0e1a2a', ch * 0.88, 90, 800);

  ctx.save();
  ctx.scale(ZOOM, ZOOM);
  ctx.translate(-cam.x, -cam.y);

  const x0 = Math.max(0, Math.floor(cam.x / TILE) - 1);
  const x1 = Math.min(W - 1, Math.ceil((cam.x + cw / ZOOM) / TILE) + 1);
  const y0 = Math.max(0, Math.floor(cam.y / TILE) - 1);
  const y1 = Math.min(H - 1, Math.ceil((cam.y + ch / ZOOM) / TILE) + 1);

  // 地下背景(防止洞穴透出天空)
  for (let tx = x0; tx <= x1; tx++) {
    const top = topSolid[tx];
    if (top > y1) continue;
    const ys = Math.max(top, y0);
    for (let ty = ys; ty <= y1; ty++) {
      const depth = Math.min(1, (ty - top) / 40);
      ctx.fillStyle = mixCol('#4a3220', '#241408', depth);
      ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
    }
  }
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const t = world[idx(tx, ty)];
      if (t !== T.AIR) drawTile(tx, ty, t);
    }
  }
  // 挖掘裂纹
  if (mineProg > 0 && mineTarget >= 0) {
    const tx = mineTarget % W, ty = Math.floor(mineTarget / W);
    ctx.fillStyle = 'rgba(0,0,0,' + (mineProg * 0.45).toFixed(2) + ')';
    ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
    ctx.strokeStyle = 'rgba(20,10,5,0.9)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tx * TILE + 3, ty * TILE + 2);
    ctx.lineTo(tx * TILE + 8, ty * TILE + 8);
    ctx.lineTo(tx * TILE + 5, ty * TILE + 14);
    ctx.moveTo(tx * TILE + 13, ty * TILE + 3);
    ctx.lineTo(tx * TILE + 8, ty * TILE + 8);
    ctx.lineTo(tx * TILE + 13, ty * TILE + 12);
    ctx.stroke();
  }
  drawEntities();
  drawParticles();
  drawDarkness(b, x0, y0, x1, y1);
  ctx.restore();

  drawHUD(b);
}

// ---------- HUD ----------
/**
 * 功能：绘制按生命比例填充的像素红心。
 * 输入：屏幕坐标 x、y 和填充比例 frac。
 * 输出：无；直接绘制到 Canvas。
 */
function drawHeart(x, y, frac) {
  const s = 2.2;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#3a1220';
  heartPath(); ctx.fill();
  if (frac > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, 11 * frac, 11);
    ctx.clip();
    ctx.fillStyle = '#e0393e';
    heartPath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(2, 1.5, 3, 2);
    ctx.restore();
  }
  ctx.restore();
}
/**
 * 功能：创建红心路径。
 * 输入：无。
 * 输出：无；建立当前 Canvas 路径。
 */
function heartPath() {
  ctx.beginPath();
  ctx.moveTo(5.5, 10);
  ctx.lineTo(0.5, 5);
  ctx.quadraticCurveTo(-1, 1.5, 2.5, 0.5);
  ctx.quadraticCurveTo(4.5, 0, 5.5, 2);
  ctx.quadraticCurveTo(6.5, 0, 8.5, 0.5);
  ctx.quadraticCurveTo(12, 1.5, 10.5, 5);
  ctx.closePath();
}

/**
 * 功能：按物品类别绘制背包和快捷栏图标。
 * 输入：Canvas 上下文、物品 id、坐标和尺寸。
 * 输出：无；直接绘制到目标 Canvas。
 */
function drawItemIcon(c, id, x, y, size) {
  const it = ITEMS[id];
  const u = size / 16;
  c.save();
  c.translate(x, y);
  c.scale(u, u);
  if (it.kind === 'pick') {
    c.strokeStyle = '#8a5f33'; c.lineWidth = 2.6;
    c.beginPath(); c.moveTo(4, 13); c.lineTo(11, 5); c.stroke();
    c.strokeStyle = it.col; c.lineWidth = 3;
    c.beginPath(); c.moveTo(6, 3.5); c.quadraticCurveTo(11, 1.5, 14, 5); c.stroke();
  } else if (it.kind === 'sword') {
    c.strokeStyle = it.col; c.lineWidth = 3;
    c.beginPath(); c.moveTo(4, 12); c.lineTo(12, 4); c.stroke();
    c.strokeStyle = '#8a5f33'; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(3, 9); c.lineTo(7, 13); c.stroke();
  } else if (id === 'torch') {
    c.fillStyle = '#8a5f33'; c.fillRect(6, 7, 4, 8);
    c.fillStyle = '#ff8c2e'; c.fillRect(5, 2, 6, 6);
    c.fillStyle = '#ffd75e'; c.fillRect(6.5, 3.5, 3, 3);
  } else if (id === 'bench') {
    c.fillStyle = '#9c6b3f'; c.fillRect(1, 4, 14, 4);
    c.fillStyle = '#7a5228'; c.fillRect(3, 8, 3, 7); c.fillRect(10, 8, 3, 7);
  } else if (it.kind === 'mat') {
    c.fillStyle = '#7a7a82'; c.fillRect(3, 3, 10, 10);
    c.fillStyle = it.col; c.fillRect(5, 5, 3, 3); c.fillRect(8, 8, 3, 2);
  } else {
    c.fillStyle = it.col; c.fillRect(2, 2, 12, 12);
    c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(2, 8, 12, 6);
    c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(2, 2, 12, 2);
  }
  c.restore();
}

const hotbarGeom = { x: 0, y: 0, size: 46, n: 10 };
/**
 * 功能：绘制红心、金币、天数、快捷栏和夜间警告。
 * 输入：当前夜晚亮度 b。
 * 输出：无；直接绘制到 Canvas。
 */
function drawHUD(b) {
  const cw = canvas.width, ch = canvas.height;
  // 红心
  const hearts = Math.ceil(player.maxhp / 20);
  for (let i = 0; i < hearts; i++) {
    const frac = Math.max(0, Math.min(1, (player.hp - i * 20) / 20));
    drawHeart(14 + i * 28, 12, frac);
  }
  // 金币
  ctx.fillStyle = '#f2c84b';
  ctx.beginPath(); ctx.arc(22, 52, 7, 0, 6.29); ctx.fill();
  ctx.fillStyle = '#b8922a';
  ctx.beginPath(); ctx.arc(22, 52, 4.5, 0, 6.29); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('× ' + coins, 34, 57);

  // 天数与时间
  ctx.textAlign = 'right';
  ctx.font = 'bold 15px "Microsoft YaHei",monospace';
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(cw - 158, 10, 148, 30);
  ctx.fillStyle = isNight() ? '#9fb4ff' : '#ffe9b0';
  ctx.fillText((isNight() ? '🌙' : '☀') + ' 第 ' + dayCount + ' 天', cw - 20, 30);

  // 快捷栏
  const size = hotbarGeom.size, n = hotbarGeom.n;
  const bx = (cw - size * n) / 2, by = ch - size - 12;
  hotbarGeom.x = bx; hotbarGeom.y = by;
  for (let i = 0; i < n; i++) {
    const x = bx + i * size;
    ctx.fillStyle = 'rgba(12,14,24,0.72)';
    ctx.fillRect(x, by, size - 4, size - 4);
    ctx.strokeStyle = i === sel ? '#f2c84b' : '#555a6a';
    ctx.lineWidth = i === sel ? 3 : 2;
    ctx.strokeRect(x, by, size - 4, size - 4);
    const s = inv[i];
    if (s) {
      drawItemIcon(ctx, s.id, x + 7, by + 6, 28);
      if (s.n > 1) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(String(s.n), x + size - 8, by + size - 8);
      }
    }
    ctx.fillStyle = '#8a94a8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(String((i + 1) % 10), x + 3, by + 11);
  }
  // 夜间提示
  if (isNight() && zombies.length > 0) {
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,90,80,' + (0.6 + 0.4 * Math.sin(gameTime * 5)).toFixed(2) + ')';
    ctx.font = 'bold 14px "Microsoft YaHei",monospace';
    ctx.fillText('⚠ 僵尸出没 · 数量 ' + zombies.length, cw / 2, 26);
  }
  ctx.textAlign = 'left';
}

/**
 * 功能：处理快捷栏的鼠标点击选择。
 * 输入：屏幕坐标 mx、my。
 * 输出：布尔值，点击命中 HUD 时返回 true。
 */
function handleUIClick(mx, my) {
  const g = hotbarGeom;
  if (my >= g.y && my <= g.y + g.size && mx >= g.x && mx <= g.x + g.size * g.n) {
    const i = Math.floor((mx - g.x) / g.size);
    if (i >= 0 && i < g.n) { sel = i; showSelName(); }
    return true;
  }
  return false;
}

// ---------- 背包 / 合成面板 ----------
const invPanelEl = document.getElementById('invPanel');
const invGridEl = document.getElementById('invGrid');
const craftListEl = document.getElementById('craftList');
const craftTitleEl = document.getElementById('craftTitle');
const slotCanvases = [];

/**
 * 功能：创建 30 格背包 DOM 并绑定快捷栏交换。
 * 输入：无。
 * 输出：无；重建背包元素数组。
 */
function buildInvGrid() {
  invGridEl.innerHTML = '';
  slotCanvases.length = 0;
  for (let i = 0; i < 30; i++) {
    const d = document.createElement('div');
    d.className = 'slot' + (i < 10 ? ' hot' : '');
    const cv = document.createElement('canvas');
    cv.width = 28; cv.height = 28;
    const cnt = document.createElement('span');
    cnt.className = 'cnt';
    d.appendChild(cv);
    d.appendChild(cnt);
    d.title = '点击与快捷栏第 ' + (sel + 1) + ' 格交换';
    d.addEventListener('click', () => {
      const tmp = inv[i];
      inv[i] = inv[sel];
      inv[sel] = tmp;
      refreshInvPanel();
      sfx('place');
    });
    invGridEl.appendChild(d);
    slotCanvases.push({ cv, cnt, d });
  }
}

/**
 * 功能：刷新背包格子和合成列表。
 * 输入：无。
 * 输出：无；重绘图标、数量和配方状态。
 */
function refreshInvPanel() {
  if (!slotCanvases.length) return;
  for (let i = 0; i < 30; i++) {
    const { cv, cnt } = slotCanvases[i];
    const c = cv.getContext('2d');
    c.clearRect(0, 0, 28, 28);
    const s = inv[i];
    if (s) {
      drawItemIcon(c, s.id, 0, 0, 28);
      cnt.textContent = s.n > 1 ? s.n : '';
    } else cnt.textContent = '';
  }
  if (panelOpen) refreshCraftList();
}

/**
 * 功能：检测玩家附近是否有工作台。
 * 输入：无。
 * 输出：布尔值，五格范围内存在工作台时为 true。
 */
function nearBench() {
  const px = Math.floor(player.x), py = Math.floor(player.y);
  for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) {
    if (getT(px + dx, py + dy) === T.BENCH) return true;
  }
  return false;
}

/**
 * 功能：检查工具站距离、材料与唯一工具限制。
 * 输入：配方对象 r。
 * 输出：布尔值，当前允许合成时为 true。
 */
function canCraft(r) {
  if (r.station && !nearBench()) return false;
  for (const k in r.req) if (countItem(k) < r.req[k]) return false;
  const it = ITEMS[r.out];
  if ((it.kind === 'pick' || it.kind === 'sword') && countItem(r.out) > 0) return false;
  return true;
}

/**
 * 功能：渲染全部配方及材料满足状态。
 * 输入：无。
 * 输出：无；重建合成列表 DOM。
 */
function refreshCraftList() {
  const nb = nearBench();
  craftTitleEl.textContent = nb ? '合成(已连接工作台)' : '合成(高级配方需靠近工作台)';
  craftListEl.innerHTML = '';
  for (const r of RECIPES) {
    const it = ITEMS[r.out];
    const ok = canCraft(r);
    const row = document.createElement('div');
    row.className = 'recipe ' + (ok ? 'ok' : 'no');
    const cv = document.createElement('canvas');
    cv.width = 26; cv.height = 26;
    drawItemIcon(cv.getContext('2d'), r.out, 0, 0, 26);
    row.appendChild(cv);
    const mid = document.createElement('div');
    let reqHtml = '';
    for (const k in r.req) {
      const have = countItem(k), need = r.req[k];
      const cls = have >= need ? '' : ' class="lack"';
      reqHtml += '<span' + cls + '>' + ITEMS[k].name + ' ' + have + '/' + need + '</span> ';
    }
    mid.innerHTML = '<div class="rname">' + it.name + (r.n > 1 ? ' ×' + r.n : '') + '</div>' +
      '<div class="rreq">' + reqHtml + '</div>' +
      (r.station ? '<div class="st">需要工作台</div>' : '');
    row.appendChild(mid);
    if (ok) {
      row.addEventListener('click', () => {
        for (const k in r.req) removeItem(k, r.req[k]);
        addItem(r.out, r.n);
        sfx('craft');
        toast('合成了 ' + it.name);
        refreshCraftList();
      });
    }
    craftListEl.appendChild(row);
  }
}

/**
 * 功能：打开或关闭背包与合成面板。
 * 输入：无。
 * 输出：无；切换 panelOpen 和面板可见性。
 */
function togglePanel() {
  panelOpen = !panelOpen;
  invPanelEl.classList.toggle('hidden', !panelOpen);
  if (panelOpen) { refreshInvPanel(); refreshCraftList(); }
}

/**
 * 功能：显示基础操作帮助。
 * 输入：无。
 * 输出：无；显示一条帮助提示。
 */
function toggleHelp() {
  toast('A/D移动 · 空格跳 · 左键挖/放/攻击 · E背包合成 · 滚轮切换物品');
}

// ---------- 主循环 ----------
let lastT = 0, acc = 0;
/**
 * 功能：按固定 60Hz 步进更新游戏并请求下一帧。
 * 输入：浏览器时间戳 ts。
 * 输出：无；持续调度主循环。
 */
function loop(ts) {
  requestAnimationFrame(loop);
  if (!started) return;
  const now = ts / 1000;
  let dt = now - lastT;
  lastT = now;
  if (dt > 0.25) dt = 0.25;
  acc += dt;
  const step = 1 / 60;
  while (acc >= step) {
    update(step);
    acc -= step;
  }
  render();
}
requestAnimationFrame(loop);

// ---------- 启动 ----------
let seed = (Math.random() * 1e9) | 0;
const seedTextEl = document.getElementById('seedText');
seedTextEl.textContent = seed;
document.getElementById('reseed').addEventListener('click', () => {
  seed = (Math.random() * 1e9) | 0;
  seedTextEl.textContent = seed;
});

/**
 * 功能：按当前种子初始化世界、玩家、背包和界面。
 * 输入：无。
 * 输出：无；进入可玩状态。
 */
function startGame() {
  genWorld(seed);
  // 出生点:世界中部
  spawnX = Math.floor(W / 2);
  spawnY = topSolid[spawnX] - 3;
  player.x = spawnX + 0.1;
  player.y = spawnY;
  player.hp = player.maxhp;
  player.dead = false;
  zombies = [];
  particles = [];
  coins = 0;
  gameTime = DAY_LEN * 0.15; // 从清晨开始
  dayCount = 1;
  inv = new Array(30).fill(null);
  sel = 0;
  addItem('wood_pick', 1);
  addItem('wood_sword', 1);
  addItem('torch', 12);
  addItem('wood', 20);
  cam.x = player.x * TILE - canvas.width / ZOOM / 2;
  cam.y = player.y * TILE - canvas.height / ZOOM / 2;
  buildInvGrid();
  refreshInvPanel();
  started = true;
  document.getElementById('startPanel').classList.add('hidden');
  document.getElementById('deathPanel').classList.add('hidden');
  toast('白天努力收集,夜晚活到最后!');
}

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('respawnBtn').addEventListener('click', () => {
  player.x = spawnX + 0.1;
  player.y = spawnY;
  player.vx = 0; player.vy = 0;
  player.hp = player.maxhp;
  player.dead = false;
  player.invuln = 2;
  document.getElementById('deathPanel').classList.add('hidden');
});