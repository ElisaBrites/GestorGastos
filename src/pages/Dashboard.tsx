import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ChartPie,
  PiggyBank,
  Plus,
  Repeat,
  Sparkles,
  WalletCards,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { useUI } from '../store/useUI'
import {
  percentChange,
  settledTransactions,
  sumByType,
  totalsForMonth,
  walletBalances,
  walletIsIncluded,
} from '../lib/calc'
import {
  lastNMonthKeys,
  monthKey,
  monthLabel,
  relativeDate,
  shiftMonthKey,
  todayISO,
} from '../lib/dates'
import {
  formatMoney,
  formatPercent,
  formatSigned,
} from '../lib/format'
import { cn } from '../lib/utils'
import type { Transaction, Transfer } from '../types'
import { PageHeader, SectionHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { CategoryIcon } from '../components/ui/CategoryIcon'
import { EmptyState } from '../components/ui/EmptyState'
import { TransactionRow } from '../components/TransactionRow'
import { TransferRow } from '../components/TransferRow'
import {
  CashflowChart,
  type CashflowPoint,
} from '../components/charts/CashflowChart'
import { CategoryDonut } from '../components/charts/CategoryDonut'
import { ChartLegend } from '../components/charts/ChartKit'

type MovementItem =
  | { kind: 'tx'; date: string; createdAt: string; tx: Transaction }
  | { kind: 'transfer'; date: string; createdAt: string; transfer: Transfer }

function DeltaBadge({ change, invert = false }: { change: number | null; invert?: boolean }) {
  if (change === null) {
    return <span className="text-[11px] text-faint">Sin datos previos</span>
  }
  const positive = change >= 0
  const good = invert ? !positive : positive
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold tnum',
        good ? 'bg-income-soft text-income' : 'bg-expense-soft text-expense',
      )}
    >
      {positive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
      {formatPercent(Math.abs(change), 1)}
    </span>
  )
}

function KpiCard({
  label,
  value,
  icon,
  tone,
  footer,
}: {
  label: string
  value: string
  icon: ReactNode
  tone: 'income' | 'expense' | 'brand'
  footer: React.ReactNode
}) {
  const toneClass = {
    income: 'bg-income-soft text-income',
    expense: 'bg-expense-soft text-expense',
    brand: 'bg-brand-soft text-brand',
  }[tone]

  return (
    <div className="card flex flex-col justify-between p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-medium text-muted">{label}</p>
        <span className={cn('grid h-8 w-8 place-items-center rounded-xl', toneClass)}>
          {icon}
        </span>
      </div>
      <p className="mt-4 text-[23px] font-semibold leading-none tracking-[-0.03em] tnum">
        {value}
      </p>
      <div className="mt-3">{footer}</div>
    </div>
  )
}

export function Dashboard() {
  const wallets = useStore((state) => state.wallets)
  const categories = useStore((state) => state.categories)
  const transactions = useStore((state) => state.transactions)
  const transfers = useStore((state) => state.transfers)
  const recurring = useStore((state) => state.recurring)
  const currency = useStore((state) => state.settings.currency)
  const openTransactionModal = useUI((state) => state.openTransactionModal)
  const openTransferModal = useUI((state) => state.openTransferModal)
  const referenceDate = useUI((state) => state.referenceDate)

  const month = monthKey(referenceDate)
  const prevKey = shiftMonthKey(month, -1)
  const today = todayISO()
  /** Los programados siempre son posteriores a hoy y a la fecha consultada. */
  const scheduleCutoff = referenceDate > today ? referenceDate : today

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  )

  const settled = useMemo(
    () => settledTransactions(transactions, referenceDate),
    [transactions, referenceDate],
  )
  const monthTransactions = useMemo(
    () => settled.filter((tx) => monthKey(tx.date) === month),
    [settled, month],
  )
  const totals = useMemo(() => sumByType(monthTransactions), [monthTransactions])
  const prevTotals = useMemo(
    () => totalsForMonth(settled, prevKey),
    [settled, prevKey],
  )
  const balances = useMemo(
    () => walletBalances(wallets, transactions, transfers, referenceDate),
    [wallets, transactions, transfers, referenceDate],
  )
  const includedWallets = useMemo(() => wallets.filter(walletIsIncluded), [wallets])
  const totalBalance = useMemo(
    () =>
      includedWallets.reduce((sum, wallet) => sum + (balances.get(wallet.id) ?? 0), 0),
    [includedWallets, balances],
  )
  const monthMovementCount =
    monthTransactions.length +
    transfers.filter(
      (transfer) =>
        transfer.date <= referenceDate && monthKey(transfer.date) === month,
    ).length

  const scheduledMovements = useMemo(() => {
    const items: MovementItem[] = [
      ...transactions
        .filter((tx) => tx.date > scheduleCutoff)
        .map((tx) => ({
          kind: 'tx' as const,
          date: tx.date,
          createdAt: tx.createdAt,
          tx,
        })),
      ...transfers
        .filter((transfer) => transfer.date > scheduleCutoff)
        .map((transfer) => ({
          kind: 'transfer' as const,
          date: transfer.date,
          createdAt: transfer.createdAt,
          transfer,
        })),
    ]
    return items.sort((a, b) => (a.date < b.date ? -1 : 1)).slice(0, 4)
  }, [transactions, transfers, scheduleCutoff])

  const expenseByCategory = useMemo(() => {
    const totalsMap = new Map<string, number>()
    for (const tx of monthTransactions) {
      if (tx.type !== 'expense') continue
      totalsMap.set(tx.categoryId, (totalsMap.get(tx.categoryId) ?? 0) + tx.amount)
    }
    return [...totalsMap.entries()]
      .map(([id, value]) => {
        const category = categoryMap.get(id)
        return {
          id,
          name: category?.name ?? 'Sin categoría',
          color: category?.color ?? '#64748b',
          value,
        }
      })
      .sort((a, b) => b.value - a.value)
  }, [monthTransactions, categoryMap])

  const donutData = useMemo(() => {
    const top = expenseByCategory.slice(0, 5)
    const rest = expenseByCategory.slice(5).reduce((sum, item) => sum + item.value, 0)
    return rest > 0
      ? [...top, { id: 'rest', name: 'Otras', value: rest, color: '#94a3b8' }]
      : top
  }, [expenseByCategory])

  const cashflow = useMemo<CashflowPoint[]>(
    () =>
      lastNMonthKeys(6, month).map((key) => {
        const point = totalsForMonth(settled, key)
        return {
          key,
          label: monthLabel(key, true).slice(0, 3),
          income: point.income,
          expense: point.expense,
        }
      }),
    [settled, month],
  )

  const cashflowSummary = useMemo(() => {
    const income = cashflow.reduce((sum, point) => sum + point.income, 0)
    const expense = cashflow.reduce((sum, point) => sum + point.expense, 0)
    const best = cashflow.reduce(
      (top, point) =>
        point.income - point.expense > top.income - top.expense ? point : top,
      cashflow[0],
    )
    return {
      averageIncome: income / cashflow.length,
      averageExpense: expense / cashflow.length,
      best,
    }
  }, [cashflow])

  const recentMovements = useMemo(() => {
    const items: MovementItem[] = [
      ...settled.map((tx) => ({
        kind: 'tx' as const,
        date: tx.date,
        createdAt: tx.createdAt,
        tx,
      })),
      ...transfers
        .filter((transfer) => transfer.date <= referenceDate)
        .map((transfer) => ({
          kind: 'transfer' as const,
          date: transfer.date,
          createdAt: transfer.createdAt,
          transfer,
        })),
    ]
    return items
      .sort((a, b) => {
        if (a.date === b.date) return a.createdAt < b.createdAt ? 1 : -1
        return a.date < b.date ? 1 : -1
      })
      .slice(0, 6)
  }, [settled, transfers, referenceDate])

  const upcoming = useMemo(
    () =>
      recurring
        .filter((item) => item.active)
        .sort((a, b) => (a.nextDate < b.nextDate ? -1 : 1))
        .slice(0, 4),
    [recurring],
  )

  const savingsRate = totals.income > 0 ? (totals.net / totals.income) * 100 : 0
  const incomeChange = percentChange(totals.income, prevTotals.income)
  const expenseChange = percentChange(totals.expense, prevTotals.expense)

  return (
    <div className="page-wrap space-y-5">
      <PageHeader
        eyebrow="Resumen general"
        title="Tus finanzas, de un vistazo"
        subtitle={`${monthLabel(month)} · ${wallets.length} billetera${wallets.length === 1 ? '' : 's'} · ${monthMovementCount} movimiento${monthMovementCount === 1 ? '' : 's'} este mes`}
        actions={
          <>
            <Link to="/estadisticas">
              <Button variant="secondary">
                <ChartPie size={16} />
                <span className="hidden sm:inline">Ver estadísticas</span>
                <span className="sm:hidden">Stats</span>
              </Button>
            </Link>
            <Button onClick={() => openTransactionModal()}>
              <Plus size={16} strokeWidth={2.4} />
              Nuevo movimiento
            </Button>
          </>
        }
      />

      {transactions.length === 0 && transfers.length === 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-brand/20 bg-brand-soft p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full border-[20px] border-brand/10" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-surface text-brand shadow-sm">
              <Sparkles size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-semibold text-fg">Tu espacio está listo</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                Registra tu primer movimiento para empezar a ver tus estadísticas.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button onClick={() => openTransactionModal()}>
                <Plus size={15} />
                Añadir movimiento
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div
          className="relative overflow-hidden rounded-2xl p-5 text-white shadow-[0_20px_44px_-28px_rgba(59,45,160,0.9)]"
          style={{
            backgroundImage:
              'linear-gradient(135deg, #17142e 0%, #2c2568 58%, #5b4bf0 120%)',
          }}
        >
          <div className="pointer-events-none absolute -right-12 -top-20 h-52 w-52 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-6 -top-12 h-32 w-32 rounded-full border border-white/10" />
          <div className="relative flex items-start justify-between">
            <p className="text-[12px] font-medium text-white/65">Balance total</p>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
              <WalletCards size={16} />
            </span>
          </div>
          <p className="relative mt-4 text-[27px] font-semibold leading-none tracking-[-0.035em] tnum">
            {formatMoney(totalBalance, currency)}
          </p>
          <div className="relative mt-4 flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10.5px] font-medium text-white/75">
              {includedWallets.length === wallets.length
                ? `${wallets.length} billetera${wallets.length === 1 ? '' : 's'}`
                : `${includedWallets.length} de ${wallets.length} billeteras`}
            </span>
            <span
              className={cn(
                'rounded-md px-1.5 py-0.5 text-[10.5px] font-medium',
                totals.net >= 0
                  ? 'bg-emerald-400/15 text-emerald-200'
                  : 'bg-rose-400/15 text-rose-200',
              )}
            >
              {formatSigned(totals.net, currency)} este mes
            </span>
          </div>
        </div>

        <KpiCard
          label="Ingresos del mes"
          value={formatMoney(totals.income, currency)}
          icon={<ArrowDownLeft size={16} />}
          tone="income"
          footer={
            <div className="flex flex-wrap items-center gap-2">
              <DeltaBadge change={incomeChange} />
              <span className="text-[11px] text-faint">vs. mes anterior</span>
            </div>
          }
        />

        <KpiCard
          label="Gastos del mes"
          value={formatMoney(totals.expense, currency)}
          icon={<ArrowUpRight size={16} />}
          tone="expense"
          footer={
            <div className="flex flex-wrap items-center gap-2">
              <DeltaBadge change={expenseChange} invert />
              <span className="text-[11px] text-faint">vs. mes anterior</span>
            </div>
          }
        />

        <KpiCard
          label="Ahorro del mes"
          value={formatMoney(totals.net, currency)}
          icon={<PiggyBank size={16} />}
          tone="brand"
          footer={
            <div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface2">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    totals.net >= 0 ? 'bg-income' : 'bg-expense',
                  )}
                  style={{ width: `${Math.max(0, Math.min(100, Math.abs(savingsRate)))}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-faint">
                {totals.income > 0
                  ? `${formatPercent(savingsRate, 0)} de tus ingresos`
                  : 'Aún no hay ingresos este mes'}
              </p>
            </div>
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <SectionHeader
            title="Flujo de caja"
            subtitle="Ingresos y gastos de los últimos 6 meses"
            action={
              <ChartLegend
                items={[
                  { label: 'Ingresos', color: '#10b981' },
                  { label: 'Gastos', color: '#f43f5e' },
                ]}
              />
            }
          />
          <div className="mt-3">
            <CashflowChart data={cashflow} currency={currency} height={266} />
          </div>
          <div className="mt-1 grid grid-cols-3 divide-x divide-line border-t border-line pt-3">
            <div className="pr-3">
              <p className="text-[10px] text-faint">Media de ingresos</p>
              <p className="mt-0.5 truncate text-[12.5px] font-semibold text-income tnum">
                {formatMoney(cashflowSummary.averageIncome, currency)}
              </p>
            </div>
            <div className="px-3">
              <p className="text-[10px] text-faint">Media de gastos</p>
              <p className="mt-0.5 truncate text-[12.5px] font-semibold text-expense tnum">
                {formatMoney(cashflowSummary.averageExpense, currency)}
              </p>
            </div>
            <div className="pl-3">
              <p className="text-[10px] text-faint">
                Mejor mes · {monthLabel(cashflowSummary.best.key, true)}
              </p>
              <p className="mt-0.5 truncate text-[12.5px] font-semibold text-fg tnum">
                {formatMoney(
                  cashflowSummary.best.income - cashflowSummary.best.expense,
                  currency,
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="card flex flex-col p-5">
          <SectionHeader
            title="Gastos por categoría"
            subtitle={monthLabel(month)}
            action={
              <Link
                to="/estadisticas"
                className="inline-flex items-center gap-1 text-[11.5px] font-medium text-brand transition hover:gap-1.5"
              >
                Detalle
                <ArrowRight size={13} />
              </Link>
            }
          />
          <CategoryDonut
            data={donutData}
            total={totals.expense}
            currency={currency}
            height={196}
            centerLabel="Gastos del mes"
          />
          {expenseByCategory.length > 0 ? (
            <div className="mt-2 space-y-2.5">
              {expenseByCategory.slice(0, 5).map((item) => {
                const pct = totals.expense ? (item.value / totals.expense) * 100 : 0
                return (
                  <div key={item.id}>
                    <div className="flex items-center justify-between gap-3 text-[11.5px]">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate text-muted">{item.name}</span>
                      </span>
                      <span className="shrink-0 tnum font-medium text-fg">
                        {formatMoney(item.value, currency)}
                      </span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface2">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="mt-1 text-center text-[12px] text-faint">
              Sin gastos registrados este mes.
            </p>
          )}
        </section>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <section className="card p-4 sm:p-5 lg:col-span-2">
          <SectionHeader
            className="px-1"
            title="Movimientos recientes"
            subtitle="Toca un movimiento para editarlo"
            action={
              <Link
                to="/movimientos"
                className="inline-flex items-center gap-1 text-[11.5px] font-medium text-brand transition hover:gap-1.5"
              >
                Ver todos
                <ArrowRight size={13} />
              </Link>
            }
          />
          {recentMovements.length > 0 ? (
            <div className="mt-2 divide-y divide-line">
              {recentMovements.map((item) =>
                item.kind === 'tx' ? (
                  <TransactionRow
                    key={item.tx.id}
                    transaction={item.tx}
                    asOf={referenceDate}
                    category={categoryMap.get(item.tx.categoryId)}
                    wallet={wallets.find((wallet) => wallet.id === item.tx.walletId)}
                    currency={currency}
                    onClick={() => openTransactionModal({ editId: item.tx.id })}
                  />
                ) : (
                  <TransferRow
                    key={item.transfer.id}
                    transfer={item.transfer}
                    asOf={referenceDate}
                    fromWallet={wallets.find(
                      (wallet) => wallet.id === item.transfer.fromWalletId,
                    )}
                    toWallet={wallets.find(
                      (wallet) => wallet.id === item.transfer.toWalletId,
                    )}
                    currency={currency}
                    onClick={() => openTransferModal({ editId: item.transfer.id })}
                  />
                ),
              )}
            </div>
          ) : (
            <EmptyState
              icon={<ArrowDownLeft size={20} />}
              title="Todavía no hay movimientos"
              description="Cuando registres un gasto, ingreso o transferencia aparecerá aquí."
              action={
                <Button size="sm" onClick={() => openTransactionModal()}>
                  <Plus size={14} />
                  Añadir movimiento
                </Button>
              }
            />
          )}
        </section>

        <div className="space-y-4">
          <section className="card p-5">
            <SectionHeader
              title="Billeteras"
              action={
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openTransferModal()}
                    disabled={wallets.length < 2}
                    className="inline-flex items-center gap-1 text-[11.5px] font-medium text-brand transition hover:gap-1.5 disabled:opacity-45"
                  >
                    Transferir
                  </button>
                  <Link
                    to="/billeteras"
                    className="inline-flex items-center gap-1 text-[11.5px] font-medium text-brand transition hover:gap-1.5"
                  >
                    Gestionar
                    <ArrowRight size={13} />
                  </Link>
                </div>
              }
            />
            <div className="mt-3 space-y-1">
              {wallets.slice(0, 5).map((wallet) => (
                <Link
                  key={wallet.id}
                  to="/billeteras"
                  className="flex items-center gap-3 rounded-xl px-1 py-2 transition hover:bg-surface2"
                >
                  <CategoryIcon
                    icon={wallet.icon}
                    color={wallet.color}
                    size={34}
                    radius={11}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-fg">{wallet.name}</p>
                    <p className="text-[10.5px] text-faint">
                      {wallet.type === 'bank'
                        ? 'Cuenta bancaria'
                        : wallet.type === 'card'
                          ? 'Tarjeta'
                          : wallet.type === 'cash'
                            ? 'Efectivo'
                            : wallet.type === 'savings'
                              ? 'Ahorros'
                              : wallet.type === 'investment'
                                ? 'Inversión'
                                : 'Otra'}
                      {!walletIsIncluded(wallet) && ' · Fuera del total'}
                    </p>
                  </div>
                  <p
                    className={cn(
                      'tnum text-[12.5px] font-semibold',
                      walletIsIncluded(wallet) ? 'text-fg' : 'text-muted',
                    )}
                  >
                    {formatMoney(balances.get(wallet.id) ?? 0, currency)}
                  </p>
                </Link>
              ))}
              {wallets.length === 0 && (
                <p className="py-3 text-center text-[12px] text-faint">
                  Crea una billetera para empezar.
                </p>
              )}
            </div>
          </section>

          {referenceDate >= today && scheduledMovements.length > 0 && (
            <section className="card p-5">
              <SectionHeader
                title="Movimientos programados"
                subtitle="Se contabilizarán al llegar su fecha"
                action={
                  <Link
                    to="/movimientos"
                    className="inline-flex items-center gap-1 text-[11.5px] font-medium text-brand transition hover:gap-1.5"
                  >
                    Ver todos
                    <ArrowRight size={13} />
                  </Link>
                }
              />
              <div className="mt-2 space-y-1">
                {scheduledMovements.map((item) =>
                  item.kind === 'tx' ? (
                    <TransactionRow
                      key={item.tx.id}
                      transaction={item.tx}
                      asOf={referenceDate}
                      category={categoryMap.get(item.tx.categoryId)}
                      wallet={wallets.find((wallet) => wallet.id === item.tx.walletId)}
                      currency={currency}
                      compact
                      onClick={() => openTransactionModal({ editId: item.tx.id })}
                    />
                  ) : (
                    <TransferRow
                      key={item.transfer.id}
                      transfer={item.transfer}
                      asOf={referenceDate}
                      fromWallet={wallets.find(
                        (wallet) => wallet.id === item.transfer.fromWalletId,
                      )}
                      toWallet={wallets.find(
                        (wallet) => wallet.id === item.transfer.toWalletId,
                      )}
                      currency={currency}
                      compact
                      onClick={() => openTransferModal({ editId: item.transfer.id })}
                    />
                  ),
                )}
              </div>
            </section>
          )}

          <section className="card p-5">
            <SectionHeader
              title="Próximos fijos"
              subtitle={
                referenceDate !== today
                  ? 'Calendario real, independiente de la fecha de referencia'
                  : undefined
              }
              action={
                <Link
                  to="/fijos"
                  className="inline-flex items-center gap-1 text-[11.5px] font-medium text-brand transition hover:gap-1.5"
                >
                  Ver todos
                  <ArrowRight size={13} />
                </Link>
              }
            />
            {upcoming.length > 0 ? (
              <div className="mt-3 space-y-2">
                {upcoming.map((item) => {
                  const category = categoryMap.get(item.categoryId)
                  const overdue = item.nextDate < today
                  return (
                    <Link
                      key={item.id}
                      to="/fijos"
                      className="flex items-center gap-3 rounded-xl px-1 py-1.5 transition hover:bg-surface2"
                    >
                      <CategoryIcon
                        icon={category?.icon ?? 'Repeat'}
                        color={category?.color ?? '#64748b'}
                        size={32}
                        radius={10}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-medium text-fg">
                          {item.note || category?.name || 'Movimiento fijo'}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <Repeat size={10} className="text-faint" />
                          <span
                            className={cn(
                              'text-[10.5px]',
                              overdue ? 'font-medium text-warn' : 'text-faint',
                            )}
                          >
                            {overdue ? 'Vencido' : relativeDate(item.nextDate)}
                          </span>
                          {!item.autoPost && (
                            <Badge tone="warn" className="px-1.5 py-0 text-[9px]">
                              Manual
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p
                        className={cn(
                          'tnum text-[12.5px] font-semibold',
                          item.type === 'income' ? 'text-income' : 'text-fg',
                        )}
                      >
                        {item.type === 'income' ? '+' : '−'}
                        {formatMoney(item.amount, currency)}
                      </p>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="mt-4 flex flex-col items-center gap-2 py-2 text-center">
                <p className="text-[12px] text-faint">
                  No tienes ingresos ni gastos fijos programados.
                </p>
                <Link to="/fijos">
                  <Button size="sm" variant="soft">
                    <Plus size={13} />
                    Programar uno
                  </Button>
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
