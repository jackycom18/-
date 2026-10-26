# ICT 任务管理看板

基于 Vue3、Vite 和 localStorage 的纯前端任务管理看板。支持新增任务、分类、星标、紧急标记、三列拖拽、主题切换和数据持久化。

## 本地运行

```bash
npm install
npm run dev
```

浏览器访问 `http://localhost:8085`。

## 验证

```bash
npm test
npm run build
```

## 目录

- `src/components/`：看板组件
- `src/composables/`：状态与主题逻辑
- `src/utils/`：存储和格式化工具
- `tests/`：自动化测试
