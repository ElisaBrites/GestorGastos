import type { Budget, Category, Transaction } from '../types'
import {
  formatShortDate,
  monthKey,
  monthLabel,
  monthRange,
  todayISO,
  yearRange,
} from './dates'

export interface BudgetProgress {
  spent: number
  remaining: number
  percent: number
  over: boolean
}

/** Valores por encima de este porcentaje se muestran como advertencia. */
export const BUDGET_WARN_PERCENT = 80

export function budgetScopeMatches(
  budget: Budget,
  categoryId: string,
  subcategoryId?: string,
) {
  return (
    budget.categoryId === categoryId &&
    (budget.subcategoryId ?? '') === (subcategoryId ?? '')
  )
}

export function isBudgetActive(budget: Budget, date: string) {
  return budget.startDate <= date && budget.endDate >= date
}

export function activeBudgetsAt(budgets: Budget[], date: string) {
  return budgets
    .filter((budget) => isBudgetActive(budget, date))
    .sort((a, b) => (a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0))
}

export function budgetsForCategory(
  budgets: Budget[],
  categoryId: string,
  date: string,
) {
  return activeBudgetsAt(
    budgets.filter((budget) => budget.categoryId === categoryId),
    date,
  )
}

/** Gasto del periodo del presupuesto, sin contar movimientos posteriores a la fecha consultada. */
export function budgetSpent(
  budget: Budget,
  transactions: Transaction[],
  asOf = todayISO(),
) {
  const end = asOf < budget.endDate ? asOf : budget.endDate
  let spent = 0
  for (const tx of transactions) {
    if (tx.type !== 'expense' || tx.categoryId !== budget.categoryId) continue
    if (budget.subcategoryId && tx.subcategoryId !== budget.subcategoryId) continue
    if (tx.date < budget.startDate || tx.date > end) continue
    spent += tx.amount
  }
  return spent
}

export function budgetProgress(
  budget: Budget,
  transactions: Transaction[],
  asOf = todayISO(),
): BudgetProgress {
  const spent = budgetSpent(budget, transactions, asOf)
  const percent = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
  return {
    spent,
    remaining: budget.amount - spent,
    percent,
    over: spent > budget.amount,
  }
}

/**
 * Suma los presupuestos activos sin duplicar importes: si una categoría tiene un
 * presupuesto general, sus presupuestos de subcategoría no se suman aparte.
 */
export function summarizeBudgets(
  budgets: Budget[],
  transactions: Transaction[],
  asOf = todayISO(),
) {
  const active = activeBudgetsAt(budgets, asOf)
  const categoriesWithGeneral = new Set(
    active.filter((budget) => !budget.subcategoryId).map((budget) => budget.categoryId),
  )
  const counted = active.filter(
    (budget) => !budget.subcategoryId || !categoriesWithGeneral.has(budget.categoryId),
  )

  let total = 0
  let spent = 0
  for (const budget of counted) {
    total += budget.amount
    spent += budgetSpent(budget, transactions, asOf)
  }

  return {
    budgets: counted,
    total,
    spent,
    remaining: total - spent,
    percent: total > 0 ? (spent / total) * 100 : 0,
  }
}

export function budgetTone(percent: number): 'ok' | 'warn' | 'over' {
  if (percent > 100) return 'over'
  if (percent >= BUDGET_WARN_PERCENT) return 'warn'
  return 'ok'
}

export function budgetToneClasses(tone: 'ok' | 'warn' | 'over') {
  if (tone === 'over') {
    return { text: 'text-expense', bar: 'bg-expense', soft: 'bg-expense-soft' }
  }
  if (tone === 'warn') {
    return { text: 'text-warn', bar: 'bg-warn', soft: 'bg-warn-soft' }
  }
  return { text: 'text-income', bar: 'bg-income', soft: 'bg-income-soft' }
}

export function budgetScopeLabel(budget: Budget, category?: Category) {
  if (!budget.subcategoryId) return category?.name ?? 'Categoría'
  const subcategory = category?.subcategories.find(
    (sub) => sub.id === budget.subcategoryId,
  )
  return subcategory ? `${category?.name ?? 'Categoría'} · ${subcategory.name}` : 'Subcategoría'
}

export function budgetPeriodLabel(budget: Budget) {
  const month = monthRange(monthKey(budget.startDate))
  if (budget.startDate === month.start && budget.endDate === month.end) {
    return monthLabel(monthKey(budget.startDate))
  }

  const year = Number(budget.startDate.slice(0, 4))
  const range = yearRange(year)
  if (budget.startDate === range.start && budget.endDate === range.end) {
    return String(year)
  }

  const startYear = budget.startDate.slice(0, 4)
  const endYear = budget.endDate.slice(0, 4)
  if (startYear === endYear) {
    return `${formatShortDate(budget.startDate)} – ${formatShortDate(budget.endDate)} ${startYear}`
  }
  return `${formatShortDate(budget.startDate)} ${startYear} – ${formatShortDate(budget.endDate)} ${endYear}`
}
