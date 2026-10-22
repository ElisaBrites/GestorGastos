import { useMemo, useState } from 'react'
import { CalendarRange, PiggyBank, Plus, Pencil, Trash2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useUI } from '../store/useUI'
import {
  activeBudgetsAt,
  budgetPeriodLabel,
  budgetProgress,
  budgetScopeLabel,
  budgetTone,
  budgetToneClasses,
  summarizeBudgets,
} from '../lib/budgets'
import { formatFullDate } from '../lib/dates'
import { formatMoney, formatPercent } from '../lib/format'
import { subcategoryVisual } from '../lib/visuals'
import { cn } from '../lib/utils'
import type { Budget, Category, Transaction } from '../types'
import { PageHeader } from '../components/layout/PageHeader'
import { BudgetModal } from '../components/BudgetModal'
import { Button } from '../components/ui/Button'
import { CategoryIcon } from '../components/ui/CategoryIcon'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'

function BudgetRow({
  budget,
  category,
  transactions,
  currency,
  referenceDate,
  status,
  onEdit,
  onDelete,
}: {
  budget: Budget
  category?: Category
  transactions: Transaction[]
  currency: string
  referenceDate: string
  status: 'active' | 'upcoming' | 'past'
  onEdit: () => void
  onDelete: () => void
}) {
  const progress =
    status === 'upcoming'
      ? { spent: 0, remaining: budget.amount, percent: 0, over: false }
      : budgetProgress(budget, transactions, referenceDate)
  const tone = budgetTone(progress.percent)
  const classes = budgetToneClasses(tone)
  const subcategory = category?.subcategories.find(
    (sub) => sub.id === budget.subcategoryId,
  )
  const visual = subcategoryVisual(subcategory, category)

  const statusBadge =
    status === 'upcoming'
      ? { label: 'Próximo', className: 'bg-brand-soft text-brand' }
      : status === 'past'
        ? { label: 'Finalizado', className: 'bg-surface2 text-muted' }
        : progress.over
          ? { label: 'Excedido', className: 'bg-expense-soft text-expense' }
          : tone === 'warn'
            ? { label: 'Cerca del límite', className: 'bg-warn-soft text-warn' }
            : { label: 'En curso', className: 'bg-income-soft text-income' }

  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
      <CategoryIcon icon={visual.icon} color={visual.color} size={40} radius={13} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-[13px] font-semibold text-fg">
            {budgetScopeLabel(budget, category)}
          </p>
          <span
            className={cn(
              'rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold',
              statusBadge.className,
            )}
          >
            {statusBadge.label}
          </span>
        </div>
        <p className="mt-0.5 flex items-center gap-1 text-[10.5px] text-faint">
          <CalendarRange size={10} />
          {budgetPeriodLabel(budget)}
          <span className="text-line-strong">·</span>
          {formatFullDate(budget.startDate)} → {formatFullDate(budget.endDate)}
        </p>

        <div className="mt-2 flex items-center gap-2.5">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface2">
            <div
              className={cn('h-full rounded-full transition-all', classes.bar)}
              style={{ width: `${Math.max(0, Math.min(100, progress.percent))}%` }}
            />
          </div>
          <span className={cn('w-10 shrink-0 text-right text-[10px] font-semibold tnum', classes.text)}>
            {formatPercent(progress.percent, 0)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <div className="text-right">
          <p className="text-[12.5px] font-semibold text-fg tnum">
            {formatMoney(progress.spent, currency)}
            <span className="font-normal text-faint"> / {formatMoney(budget.amount, currency)}</span>
          </p>
          <p className={cn('text-[10.5px] font-medium tnum', classes.text)}>
            {progress.over
              ? `${formatMoney(Math.abs(progress.remaining), currency)} excedidos`
              : `${formatMoney(progress.remaining, currency)} disponibles`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="grid h-7 w-7 place-items-center rounded-lg text-faint transition hover:bg-surface2 hover:text-fg"
            aria-label="Editar presupuesto"
            title="Editar presupuesto"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="grid h-7 w-7 place-items-center rounded-lg text-faint transition hover:bg-expense-soft hover:text-expense"
            aria-label="Eliminar presupuesto"
            title="Eliminar presupuesto"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

export function Budgets() {
  const budgets = useStore((state) => state.budgets)
  const categories = useStore((state) => state.categories)
  const transactions = useStore((state) => state.transactions)
  const currency = useStore((state) => state.settings.currency)
  const deleteBudget = useStore((state) => state.deleteBudget)
  const toast = useUI((state) => state.toast)
  const referenceDate = useUI((state) => state.referenceDate)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Budget | undefined>()
  const [deleting, setDeleting] = useState<Budget | undefined>()

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  )

  const active = useMemo(
    () => activeBudgetsAt(budgets, referenceDate),
    [budgets, referenceDate],
  )
  const upcoming = useMemo(
    () =>
      budgets
        .filter((budget) => budget.startDate > referenceDate)
        .sort((a, b) => (a.startDate < b.startDate ? -1 : 1)),
    [budgets, referenceDate],
  )
  const past = useMemo(
    () =>
      budgets
        .filter((budget) => budget.endDate < referenceDate)
        .sort((a, b) => (a.endDate > b.endDate ? -1 : 1)),
    [budgets, referenceDate],
  )

  const summary = useMemo(
    () => summarizeBudgets(budgets, transactions, referenceDate),
    [budgets, transactions, referenceDate],
  )

  const overallTone = budgetTone(summary.percent)
  const overallClasses = budgetToneClasses(overallTone)

  const openCreate = () => {
    setEditing(undefined)
    setModalOpen(true)
  }

  const openEdit = (budget: Budget) => {
    setEditing(budget)
    setModalOpen(true)
  }

  const handleDelete = () => {
    if (!deleting) return
    deleteBudget(deleting.id)
    toast('Presupuesto eliminado.')
  }

  const hasBudgets = budgets.length > 0
  const hasExpenseCategories = categories.some((category) => category.type === 'expense')

  const renderSection = (title: string, items: Budget[], status: 'active' | 'upcoming' | 'past') => {
    if (items.length === 0) return null
    return (
      <section className="card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="section-title">{title}</h2>
            <p className="mt-0.5 text-[11px] text-muted">
              {items.length} presupuesto{items.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        <div className="mt-1 divide-y divide-line">
          {items.map((budget) => (
            <BudgetRow
              key={budget.id}
              budget={budget}
              category={categoryMap.get(budget.categoryId)}
              transactions={transactions}
              currency={currency}
              referenceDate={referenceDate}
              status={status}
              onEdit={() => openEdit(budget)}
              onDelete={() => setDeleting(budget)}
            />
          ))}
        </div>
      </section>
    )
  }

  return (
    <div className="page-wrap space-y-4">
      <PageHeader
        eyebrow="Organización"
        title="Presupuestos"
        subtitle="Asigna un límite de gasto por categoría o subcategoría y controla cuánto llevas consumido."
        actions={
          <Button onClick={openCreate} disabled={!hasExpenseCategories}>
            <Plus size={16} strokeWidth={2.4} />
            Nuevo presupuesto
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11.5px] font-medium text-muted">Presupuestado</p>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-soft text-brand">
              <PiggyBank size={16} />
            </span>
          </div>
          <p className="mt-3 text-[21px] font-semibold leading-tight tracking-[-0.025em] text-fg tnum">
            {formatMoney(summary.total, currency)}
          </p>
          <p className="mt-1 text-[11px] text-faint">
            {active.length} activo{active.length === 1 ? '' : 's'} · {formatFullDate(referenceDate)}
          </p>
        </div>

        <div className="card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11.5px] font-medium text-muted">Gastado</p>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-expense-soft text-expense">
              <CalendarRange size={16} />
            </span>
          </div>
          <p className="mt-3 text-[21px] font-semibold leading-tight tracking-[-0.025em] text-expense tnum">
            {formatMoney(summary.spent, currency)}
          </p>
          <p className="mt-1 text-[11px] text-faint">
            {formatPercent(summary.percent, 1)} del total presupuestado
          </p>
        </div>

        <div className="card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11.5px] font-medium text-muted">Disponible</p>
            <span
              className={cn(
                'grid h-8 w-8 place-items-center rounded-xl',
                overallClasses.soft,
                overallClasses.text,
              )}
            >
              <PiggyBank size={16} />
            </span>
          </div>
          <p
            className={cn(
              'mt-3 text-[21px] font-semibold leading-tight tracking-[-0.025em] tnum',
              summary.remaining < 0 ? 'text-expense' : 'text-income',
            )}
          >
            {formatMoney(summary.remaining, currency)}
          </p>
          <p className="mt-1 text-[11px] text-faint">
            {summary.remaining < 0 ? 'Presupuesto excedido' : 'Para seguir gastando'}
          </p>
        </div>

        <div className="card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11.5px] font-medium text-muted">Consumo global</p>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-surface2 text-muted">
              <CalendarRange size={16} />
            </span>
          </div>
          <p className="mt-3 text-[21px] font-semibold leading-tight tracking-[-0.025em] text-fg tnum">
            {summary.total > 0 ? formatPercent(summary.percent, 0) : '—'}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface2">
            <div
              className={cn('h-full rounded-full transition-all', overallClasses.bar)}
              style={{
                width: `${Math.max(0, Math.min(100, summary.percent))}%`,
              }}
            />
          </div>
        </div>
      </div>

      {hasBudgets ? (
        <div className="space-y-4">
          {renderSection('Activos en la fecha de referencia', active, 'active')}
          {renderSection('Próximos periodos', upcoming, 'upcoming')}
          {renderSection('Periodos finalizados', past, 'past')}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={<PiggyBank size={20} />}
            title="Todavía no hay presupuestos"
            description="Crea un límite para una categoría completa o para una subcategoría concreta y elige el periodo que quieras controlar."
            action={
              <Button size="sm" onClick={openCreate} disabled={!hasExpenseCategories}>
                <Plus size={14} />
                Nuevo presupuesto
              </Button>
            }
          />
        </div>
      )}

      <div className="rounded-2xl border border-line bg-surface2/50 px-4 py-3 text-[11.5px] leading-relaxed text-muted">
        <span className="font-medium text-fg">Cómo se calcula:</span> se suman los gastos
        de la categoría (o subcategoría) elegida con fecha dentro del periodo y hasta la
        fecha de referencia. Los movimientos programados a futuro no cuentan hasta que
        llega su fecha.
      </div>

      <BudgetModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        budget={editing}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(undefined)}
        onConfirm={handleDelete}
        title="Eliminar presupuesto"
        description={`Vas a eliminar el presupuesto de «${deleting ? budgetScopeLabel(deleting, categoryMap.get(deleting.categoryId)) : ''}». Los movimientos no se modifican.`}
        confirmLabel="Eliminar presupuesto"
      />
    </div>
  )
}
