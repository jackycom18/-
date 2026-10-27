# 代码地图

> 最后更新：2026-10-27

## 总体结构

```text
client/src/components/Budget/
├─ BudgetDashboard.tsx          # 预算看板界面
├─ budgetDashboardModel.ts      # 汇总与每日趋势派生
├─ CostsPanel.tsx               # 费用页和视图切换入口
├─ CostsToolbar.tsx             # 列表/表格/看板切换
├─ costsModel.ts                # 既有费用、结算和分类计算
└─ useCostsLedger.ts            # 既有账本数据加载与共享状态
shared/src/i18n/
├─ en/budget.ts                 # 英文看板文案
└─ zh/budget.ts                 # 中文看板文案
```

## 逐文件核心内容

### `client/src/components/Budget/budgetDashboardModel.ts`

- 用途：纯函数计算看板汇总与每日趋势。
- 关键入口：`budgetDashboardSummary`、`budgetDailySeries`。
- 数据流：`BudgetItem` + `CostsCtx` → 显示币种计划额、实际额和日期序列。
- 注意：实际额只来自 `payers`；无付款人的费用实际额为 0。

### `client/src/components/Budget/BudgetDashboard.tsx`

- 用途：渲染四项统计、分类条形图、每日趋势、成员分摊和结算建议。
- 数据流：筛选后的费用 + 服务端结算结果 → 只读看板。
- 注意：不写费用，不新增请求。

### `client/src/components/Budget/CostsPanel.tsx`

- 用途：费用页主入口，复用 `useCostsLedger` 的账本与结算数据。
- 关键入口：`view === 'dashboard'` 分支。
- 注意：看板使用现有筛选后的 `filtered` 费用。

### `client/src/components/Budget/CostsToolbar.tsx`

- 用途：列表、表格、预算看板三视图切换。
- 关键入口：`CostsView` 和工具栏视图按钮组。

### `shared/src/i18n/{en,zh}/budget.ts`

- 用途：预算看板文案。
- 注意：其它语言缺键时由 TREK 的翻译回退机制处理。
