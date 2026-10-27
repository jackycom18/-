import { BarChart3, CalendarDays, CircleDollarSign, Users, WalletCards } from 'lucide-react';

import { useTranslation } from '../../i18n';
import type { BudgetItem } from '../../types';
import { formatMoney } from '../../utils/formatters';
import { budgetDailySeries, budgetDashboardSummary } from './budgetDashboardModel';
import { catMeta } from './costsCategories';
import { categoryBreakdown, type CostsCtx, type CostsSettlementResponse } from './costsModel';

interface BudgetDashboardProps {
  items: BudgetItem[];
  ctx: CostsCtx;
  settlement: CostsSettlementResponse | null;
}

/**
 * 功能：把费用日期格式化为看板上的短日期。
 * 输入：dateKey 为 YYYY-MM-DD 或空字符串，locale 为当前语言。
 * 输出：本地化短日期；无日期时返回 null。
 */
function dateLabel(dateKey: string, locale: string): string | null {
  if (!dateKey) return null;
  try {
    return new Date(`${dateKey}T00:00:00Z`).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });
  } catch {
    return dateKey;
  }
}

/**
 * 功能：把金额占总额的比例换算为 0-100 的百分比。
 * 输入：amount 为当前分类金额，total 为计划总额。
 * 输出：保留一位小数的百分比；总额不大于 0 时返回 0。
 */
function sharePct(amount: number, total: number): number {
  return total > 0 ? Math.max(0, Math.round((amount / total) * 1000) / 10) : 0;
}

/**
 * 功能：展示 TREK 行程的计划、实际、分类、每日和成员结算预算看板。
 * 输入：items 为筛选后的费用，ctx 为币种和汇率，settlement 为服务端结算结果。
 * 输出：完整的预算看板界面。
 */
export default function BudgetDashboard({ items, ctx, settlement }: BudgetDashboardProps) {
  const { t, locale } = useTranslation();
  const summary = budgetDashboardSummary(items, ctx);
  const categoryRows = categoryBreakdown(items, ctx);
  const dailyRows = budgetDailySeries(items, ctx);
  // maxDaily 是趋势条的统一比例尺，至少为 1 以防除零。
  const maxDaily = Math.max(1, ...dailyRows.flatMap((row) => [row.planned, row.actual]));
  const memberRows = settlement?.finalBudgets || [];
  const flows = settlement?.flows || [];
  const money = (amount: number) => formatMoney(amount, ctx.displayCurrency, locale);
  const statCard = 'rounded-2xl border border-edge-faint bg-surface-secondary p-4';
  const panel = 'overflow-hidden rounded-2xl border border-edge-faint bg-surface-secondary';
  const panelHead = 'flex min-h-[48px] items-center gap-2 border-b border-edge-faint bg-surface-tertiary px-4 py-2.5';

  return (
    <section aria-label={t('costs.dashboard.title')} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-edge-faint bg-surface-secondary px-5 py-14 text-center text-content-faint">
          {t('costs.dashboard.empty')}
        </div>
      ) : (
        <>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}
            className="costs-summary"
          >
            <article className={statCard}>
              <CircleDollarSign size={18} className="text-content-muted" />
              <div className="mt-4 text-content-faint" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))' }}>
                {t('costs.dashboard.planned')}
              </div>
              <div
                className="mt-1 font-semibold tabular-nums text-content"
                style={{ fontSize: 'calc(24px * var(--fs-scale-title, 1))' }}
              >
                {money(summary.planned)}
              </div>
            </article>
            <article className={statCard}>
              <WalletCards size={18} className="text-content-muted" />
              <div className="mt-4 text-content-faint" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))' }}>
                {t('costs.dashboard.actual')}
              </div>
              <div
                className="mt-1 font-semibold tabular-nums text-content"
                style={{ fontSize: 'calc(24px * var(--fs-scale-title, 1))' }}
              >
                {money(summary.actual)}
              </div>
            </article>
            <article className={statCard}>
              <BarChart3 size={18} className="text-content-muted" />
              <div className="mt-4 text-content-faint" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))' }}>
                {t('costs.dashboard.pending')}
              </div>
              <div
                className="mt-1 font-semibold tabular-nums text-content"
                style={{ fontSize: 'calc(24px * var(--fs-scale-title, 1))' }}
              >
                {money(summary.pending)}
              </div>
            </article>
            <article className={statCard}>
              <div className="flex items-center justify-between text-content-muted">
                <Users size={18} />
                <b className="tabular-nums text-content">{summary.completionPct}%</b>
              </div>
              <div className="mt-4 text-content-faint" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))' }}>
                {t('costs.dashboard.completion')}
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-tertiary">
                <div className="h-full rounded-full bg-accent" style={{ width: `${summary.completionPct}%` }} />
              </div>
            </article>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
            <section aria-label={t('costs.dashboard.categoryShare')} className={panel}>
              <div className={panelHead}>
                <BarChart3 size={15} />
                <h3 className="m-0 font-semibold text-content">{t('costs.dashboard.categoryShare')}</h3>
              </div>
              <div className="flex flex-col gap-4 p-4">
                {categoryRows.length === 0 ? (
                  <p className="m-0 text-content-faint">{t('costs.dashboard.noCategories')}</p>
                ) : (
                  categoryRows.map((row) => {
                    const meta = catMeta(row.key);
                    return (
                      <div key={row.key}>
                        <div className="mb-1.5 flex items-center gap-2 text-content">
                          <meta.Icon size={14} style={{ color: meta.color }} />
                          <span className="font-medium">{t(meta.labelKey)}</span>
                          <span className="ms-auto tabular-nums text-content-faint">{money(row.amount)}</span>
                          <b className="w-12 text-end tabular-nums">{sharePct(row.amount, summary.planned)}%</b>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-surface-tertiary">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.max(0, row.widthPct)}%`, background: meta.color }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <section aria-label={t('costs.dashboard.dailyTrend')} className={panel}>
              <div className={panelHead}>
                <CalendarDays size={15} />
                <h3 className="m-0 font-semibold text-content">{t('costs.dashboard.dailyTrend')}</h3>
              </div>
              <div className="flex flex-col gap-4 p-4">
                {dailyRows.length === 0 ? (
                  <p className="m-0 text-content-faint">{t('costs.dashboard.noDaily')}</p>
                ) : (
                  dailyRows.map((row) => (
                    <div key={row.dateKey || 'no-date'}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-content">
                        <span className="font-medium">{dateLabel(row.dateKey, locale) || t('costs.noDate')}</span>
                        <span className="tabular-nums text-content-faint">
                          {t('costs.dashboard.actualShort')} {money(row.actual)}
                        </span>
                      </div>
                      <div className="relative h-2.5 rounded-full bg-surface-tertiary">
                        <div
                          className="absolute inset-y-0 start-0 rounded-full opacity-35"
                          style={{ width: `${(row.planned / maxDaily) * 100}%`, background: 'var(--text-muted)' }}
                        />
                        <div
                          className="absolute inset-y-0 start-0 rounded-full"
                          style={{ width: `${(Math.max(0, row.actual) / maxDaily) * 100}%`, background: '#0f766e' }}
                        />
                      </div>
                      <div
                        className="mt-1 text-end tabular-nums text-content-faint"
                        style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))' }}
                      >
                        {t('costs.dashboard.plannedShort')} {money(row.planned)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section aria-label={t('costs.dashboard.memberAllocation')} className={panel}>
              <div className={panelHead}>
                <Users size={15} />
                <h3 className="m-0 font-semibold text-content">{t('costs.dashboard.memberAllocation')}</h3>
              </div>
              <div className="flex flex-col gap-3 p-4">
                {memberRows.length === 0 ? (
                  <p className="m-0 text-content-faint">{t('costs.dashboard.noMembers')}</p>
                ) : (
                  memberRows.map((member) => (
                    <div
                      key={member.user_id}
                      className="flex items-center gap-3 rounded-xl bg-surface-card px-3 py-2.5"
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-surface-tertiary font-semibold text-content">
                        {member.username.charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium text-content">{member.username}</span>
                      <b className="tabular-nums text-content">{money(member.final)}</b>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section aria-label={t('costs.dashboard.settlement')} className={panel}>
              <div className={panelHead}>
                <WalletCards size={15} />
                <h3 className="m-0 font-semibold text-content">{t('costs.dashboard.settlement')}</h3>
              </div>
              <div className="flex flex-col gap-2 p-4">
                {flows.length === 0 ? (
                  <p className="m-0 text-content-faint">{t('costs.everyoneSquare')}</p>
                ) : (
                  flows.map((flow, index) => (
                    <div
                      key={`${flow.from.user_id}-${flow.to.user_id}-${index}`}
                      className="flex items-center gap-2 rounded-xl bg-surface-card px-3 py-2.5"
                    >
                      <span className="min-w-0 flex-1 truncate text-content">{flow.from.username}</span>
                      <span aria-hidden className="text-content-faint">
                        →
                      </span>
                      <span className="min-w-0 flex-1 truncate text-content">{flow.to.username}</span>
                      <b className="tabular-nums text-content">{money(flow.amount)}</b>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </section>
  );
}
