# 代码地图

> 最后更新：2026-10-27

## 总体结构

```text
terraria-sandbox-game/
├─ index.html             # Canvas、开始/死亡界面、背包与合成面板
├─ game.js                # 游戏状态、物理、AI、渲染和主循环
├─ test-headless.js       # DOM/Canvas 桩与 600 秒冒烟测试
├─ screenshots/           # 游戏和合成界面截图
├─ docs/                  # 项目备忘和代码地图
└─ README.md              # 操作、验证和课程说明
```

## 模块职责

- `index.html`：提供浏览器页面骨架、像素风格 UI 和游戏入口。
- `game.js`：零依赖游戏运行时。
- `test-headless.js`：在 Node 中模拟 36000 个固定时间步，确认昼夜和僵尸循环不中断。

## 逐文件核心内容

### `game.js`

- 用途：实现完整 2D 沙盒生存体验。
- 数据：`world` 保存 520×150 图块；`player`、`zombies`、`particles` 和 `inv` 保存运行状态。
- 关键入口：`genWorld`、`moveEntity`、`handleMouse`、`updateZombies`、`drawDarkness`、`render`、`loop`。
- 数据流：键盘鼠标 → 输入状态 → `update` → 世界/实体/背包 → `render` → Canvas HUD。
- 注意：直接双击可运行，不应拆分为必须本地服务器才能加载的 ES Module。

### `test-headless.js`

- 用途：用 Proxy 和最小 DOM 对象运行 `game.js`，不依赖真实浏览器。
- 关键入口：`makeEl` 与 `requestAnimationFrame` 桩。
- 注意：每秒推进 60 个时间步，共 600 秒，覆盖完整昼夜循环。

### `index.html`

- 用途：页面、像素视觉、开始/死亡界面和合成菜单。
- 注意：无 CDN、无外部图片、无字体网络请求。
