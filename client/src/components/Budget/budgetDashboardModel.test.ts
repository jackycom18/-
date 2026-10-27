import { describe, expect, it } from 'vitest';

import { buildBudgetItem } from '../../../tests/helpers/factories';
import type { BudgetItem } from '../../types';
import { budgetDashboardSummary, budgetDailySeries, type CostsCtx } from './budgetDashboardModel';

const RATES: Record<string, number> = { EUR: 1, USD: 0.5 };

const ctx: CostsCtx = {
  me: 1,
  tripCurrency: 'EUR',
  displayCurrency: 'EUR',
  convert: (amount, currency) => amount * (RATES[(currency || 'EUR').toUpperCase()] ?? 1),
};

/**
 * 功能：构造一笔预算测试数据。
 * 输入：overrides 为需要覆盖的费用字段。
 * 输出：完整的 BudgetItem 测试对象。
 */
const expense = (overrides: Partial<BudgetItem> = {}) =>
  buildBudgetItem({ category: 'other', ...overrides });

describe('budgetDashboardModel', () => {
  it('FE-BUDGET-DASHBOARD-001: compares planned totals with the money actually paid', () => {
    const items = [
      expense({
        id: 1,
        total_price: 100,
        payers: [
          { user_id: 1, amount: 60, username: 'ada' },
          { user_id: 2, amount: 40, username: 'bob' },
        ],
      }),
      expense({
        id: 2,
        total_price: 20,
        currency: 'USD',
        payers: [{ user_id: 1, amount: 20, username: 'ada' }],
      }),
      expense({ id: 3, total_price: 30, payers: [] }),
    ];

    expect(budgetDashboardSummary(items, ctx)).toEqual({
      planned: 140,
      actual: 110,
      pending: 30,
      completionPct: 78.57,
    });
  });

  it('FE-BUDGET-DASHBOARD-002: groups the planned and paid amounts into an ascending daily series', () => {
    const items = [
      expense({
        id: 1,
        total_price: 100,
        expense_date: '2026-01-02',
        payers: [{ user_id: 1, amount: 60, username: 'ada' }],
      }),
      expense({
        id: 2,
        total_price: 20,
        currency: 'USD',
        expense_date: '2026-01-01',
        payers: [],
      }),
      expense({ id: 3, total_price: 30, expense_date: null, payers: [] }),
    ];

    expect(budgetDailySeries(items, ctx)).toEqual([
      { dateKey: '2026-01-01', planned: 10, actual: 0 },
      { dateKey: '2026-01-02', planned: 100, actual: 60 },
      { dateKey: '', planned: 30, actual: 0 },
    ]);
  });
});
