# 项目：TREK 预算看板

> 最后更新：2026-10-27

## 项目总览

- 目标：在 TREK 行程费用页新增预算看板，完成 ICT 练手实验 1.2 并用于发布领取代金券。
- 技术栈：React 19、Vite 8、NestJS 11、SQLite、TypeScript、Vitest。
- 运行：先执行 `npm run build --workspace=shared`，再执行 `npm run dev`。
- 测试：`npm test --workspace=client -- --run CostsPanel CostsToolbar useCostsLedger costsModel budgetDashboardModel`。
- 构建：`npm run build --workspace=client`。
- 入口：行程详情 → 费用 → 工具栏的“预算看板”视图。

## 当前状态

- 已完成：计划/实际支出对比、分类占比、每日趋势、成员分摊、结算建议、空状态和中英文文案。
- 已完成：代码提交、GitHub `task-1.2` 分支、发布材料和“闯关活动”作品发布。
- 作品 ID：`00705dc529400000`
- 作品链接：https://gallery.developer.huaweicloud.com/gallery/00705dc529400000
- 下一次进入项目时可继续实验 1.3。
- 卡点/风险：正式省资格赛题不得使用本次练手发布流程代答。

## 需求与约定

- 只使用免费资源，不创建 ECS、CCE、SWR 等计费服务。
- 不新增数据表、后端接口或第三方运行时依赖。
- 计划额取 `BudgetItem.total_price`；实际额取 `payers` 金额合计；结算取服务端 `finalBudgets` 和 `flows`。
- 所有源码、发布材料保存在 `C:\Users\Xzj13\Desktop\pro`。

## 待办 / 已知问题

- [x] 推送 `task-1.2` 分支到 GitHub。
- [x] 生成 `ict-publish-assets/task-1.2` 发布材料。
- [x] 发布到开发者作品展览馆“闯关活动”并领取积分。

## 版本历史

- 2026-10-27：新增预算看板视图、派生数据模型、测试、中英文文案和项目交接文档；作品发布成功并获得 200 积分。
