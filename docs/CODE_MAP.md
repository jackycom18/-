# 任务看板代码地图

## 目录结构

```text
task-kanban/
├── src/
│   ├── components/   # 看板、任务卡片、弹窗、主题、提示与庆祝动画
│   ├── composables/  # 看板状态、主题、提示和涟漪效果
│   ├── config/       # 主题与提示文案配置
│   ├── styles/       # CSS 变量
│   ├── utils/        # 存储、时间和主题工具
│   ├── App.vue       # 根组件
│   └── main.js       # Vue 入口
├── tests/            # Vitest 自动化测试
├── index.html        # HTML 入口
├── package.json      # 依赖与运行脚本
├── vite.config.js    # Vite 配置
└── vitest.config.js  # 测试配置
```

## 核心文件

- `src/composables/useKanban.js`：任务增删、拖拽流转、筛选和自动保存。
- `src/utils/storage.js`：localStorage 读写与异常降级。
- `src/components/KanbanColumn.vue`：看板列及拖放处理。
- `src/components/TaskCard.vue`：任务卡片操作。
- `src/components/AddTaskModal.vue`：任务新增表单。
