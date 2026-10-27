import type { BudgetItem } from '../../types';
import { baseTotal, booked, type CostsCtx } from './costsModel';

export type { CostsCtx } from './costsModel';

/** The top-level planned-versus-paid figures shown on the budget dashboard. */
export interface BudgetDashboardSummary {
  planned: number;
  actual: number;
  pending: number;
  completionPct: number;
}

/** One day's planned and paid amounts in the dashboard trend. */
export interface BudgetDailyPoint {
  dateKey: string;
  planned: number;
  actual: number;
}

/**
 * 功能：把一笔费用的付款人金额换算为显示币种并求和。
 * 输入：e 为费用记录，ctx 为当前显示币种和汇率上下文。
 * 输出：已记录的实际付款金额；没有付款人时返回 0。
 */
function paidTotal(e: BudgetItem, ctx: CostsCtx): number {
  return (e.payers || []).reduce((sum, payer) => sum + booked(payer.amount || 0, e, ctx), 0);
}

/**
 * 功能：四舍五入到两位小数，避免浮点误差进入看板百分比。
 * 输入：value 为待舍入数值。
 * 输出：保留两位小数的数值。
 */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * 功能：汇总全部费用的计划金额、实际付款、待付金额和付款完成率。
 * 输入：items 为行程费用，ctx 为当前显示币种和汇率上下文。
 * 输出：预算看板顶部汇总；没有计划金额时完成率为 0。
 */
export function budgetDashboardSummary(items: BudgetItem[], ctx: CostsCtx): BudgetDashboardSummary {
  // planned 是全部费用账面金额之和，actual 是已有付款人记录的实际支出。
  const planned = items.reduce((sum, item) => sum + baseTotal(item, ctx), 0);
  const actual = items.reduce((sum, item) => sum + paidTotal(item, ctx), 0);
  // pending 只显示尚未支付的金额，超付时不产生负数待付款。
  const pending = Math.max(0, planned - actual);
  // completionPct 限定在 0-100，避免退款或超付让进度条越界。
  const completionPct = planned > 0 ? round2(Math.min(100, Math.max(0, (actual / planned) * 100))) : 0;
  return { planned, actual, pending, completionPct };
}

/**
 * 功能：按费用日期汇总每日计划金额和实际付款。
 * 输入：items 为行程费用，ctx 为当前显示币种和汇率上下文。
 * 输出：日期升序的每日数据；无日期记录排在最后，dateKey 为空字符串。
 */
export function budgetDailySeries(items: BudgetItem[], ctx: CostsCtx): BudgetDailyPoint[] {
  // byDate 保存每个日期的计划与实际金额，'' 表示没有费用日期。
  const byDate = new Map<string, BudgetDailyPoint>();
  for (const item of items) {
    const dateKey = item.expense_date || '';
    const point = byDate.get(dateKey) || { dateKey, planned: 0, actual: 0 };
    point.planned += baseTotal(item, ctx);
    point.actual += paidTotal(item, ctx);
    byDate.set(dateKey, point);
  }
  return Array.from(byDate.values()).sort((a, b) => {
    if (a.dateKey === b.dateKey) return 0;
    if (a.dateKey === '') return 1;
    if (b.dateKey === '') return -1;
    return a.dateKey.localeCompare(b.dateKey);
  });
}
