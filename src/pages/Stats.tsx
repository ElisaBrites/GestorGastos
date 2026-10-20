import { useMemo, useState, type ReactNode } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChartPie,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Tag,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { sumByType } from '../lib/calc'
import {
  addMonthsISO,
  currentMonthKey,
  lastNMonthKeys,
  monthKey,
  monthLabel,
  monthRange,
  todayISO,
  yearRange,
} from '../lib/dates'
import { formatMoney, formatPercent } from '../lib/format'
import { cn, hexToRgba } from '../lib/utils'
import { subcategoryVisual } from '../lib/visuals'
import type { TxType } from '../types'
import { PageHeader } from '../components/layout/PageHeader'
import { Segmented } from '../components/ui/Segmented'
import { VisualSelect } from '../components/ui/VisualSelect'
import { CategoryIcon } from '../components/ui/CategoryIcon'
import { CategoryDonut } from '../components/charts/CategoryDonut'
import { CashflowChart, type CashflowPoint } from '../components/charts/CashflowChart'
import { ChartLegend } from '../components/charts/ChartKit'

type PeriodMode = 'month' | 'year' | 'all'

interface CategoryTotal {
  id: string
  name: string
  icon: string
  color: string
  amount: number
  count: number
  share: number
}

function StatCard({
  label,
  value,
  meta,
  icon,
  tone,
  valueClassName,
}: {
  label: string
  value: string
  meta: string
  icon: ReactNode
  tone: 'income' | 'expense' | 'brand' | 'neutral'
  valueClassName?: string
}) {
  const toneClass = {
    income: 'bg-income-soft text-income',
    expense: 'bg-expense-soft text-expense',
    brand: 'bg-brand-soft text-brand',
    neutral: 'bg-surface2 text-muted',
  }[tone]

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11.5px] font-medium text-muted">{label}</p>
        <span className={cn('grid h-8 w-8 place-items-center rounded-xl', toneClass)}>
          {icon}
        </span>
      </div>
      <p
        className={cn(
          'mt-3 truncate text-[21px] font-semibold leading-tight tracking-[-0.025em] tnum',
          valueClassName,
        )}
      >
        {value}
      </p>
      <p className="mt-1 truncate text-[11px] text-faint">{meta}</p>
    </div>
  )
}

export function Stats() {
  const transactions = useStore((state) => state.transactions)
  const categories = useStore((state) => state.categories)
  const wallets = useStore((state) => state.wallets)
  const currency = useStore((state) => state.settings.currency)

  const [mode, setMode] = useState<PeriodMode>('month')
  const [cursor, setCursor] = useState(todayISO())
  const [walletId, setWalletId] = useState('')
  const [type, setType] = useState<TxType>('expense')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  )
  const walletMap = useMemo(
    () => new Map(wallets.map((wallet) => [wallet.id, wallet])),
    [wallets],
  )

  const month = monthKey(cursor)
  const year = Number(cursor.slice(0, 4))
  const nowMonth = currentMonthKey()
  const nowYear = Number(nowMonth.slice(0, 4))

  const periodLabel =
    mode === 'month' ? monthLabel(month) : mode === 'year' ? String(year) : 'Todo el historial'

  const range =
    mode === 'month'
      ? monthRange(month)
      : mode === 'year'
        ? yearRange(year)
        : { start: '0000-01-01', end: '9999-12-31' }

  const walletLabel = walletId
    ? (walletMap.get(walletId)?.name ?? 'Billetera')
    : 'Todas las billeteras'

  const today = todayISO()

  const scheduledCount = useMemo(
    () =>
      transactions.filter((tx) => {
        if (tx.type !== type) return false
        if (walletId && tx.walletId !== walletId) return false
        if (tx.date < range.start || tx.date > range.end) return false
        return tx.date > today
      }).length,
    [transactions, type, walletId, range.start, range.end, today],
  )

  const filtered = useMemo(
    () =>
      transactions.filter((tx) => {
        if (tx.type !== type) return false
        if (walletId && tx.walletId !== walletId) return false
        if (tx.date > today) return false
        return tx.date >= range.start && tx.date <= range.end
      }),
    [transactions, type, walletId, range.start, range.end, today],
  )

  const totals = useMemo(() => sumByType(filtered), [filtered])
  const total = type === 'income' ? totals.income : totals.expense

  const categoryTotals = useMemo<CategoryTotal[]>(() => {
    const map = new Map<string, { amount: number; count: number }>()
    for (const tx of filtered) {
      const current = map.get(tx.categoryId) ?? { amount: 0, count: 0 }
      current.amount += tx.amount
      current.count += 1
      map.set(tx.categoryId, current)
    }
    return [...map.entries()]
      .map(([id, data]) => {
        const category = categoryMap.get(id)
        return {
          id,
          name: category?.name ?? 'Sin categoría',
          icon: category?.icon ?? 'Tag',
          color: category?.color ?? '#64748b',
          amount: data.amount,
          count: data.count,
          share: total ? (data.amount / total) * 100 : 0,
        }
      })
      .sort((a, b) => b.amount - a.amount)
  }, [filtered, categoryMap, total])

  const selected =
    categoryTotals.find((category) => category.id === selectedCategoryId) ??
    categoryTotals[0]

  const subcategoryRows = useMemo(() => {
    if (!selected) return []
    const selectedCategory = categoryMap.get(selected.id)
    const map = new Map<string, { amount: number; count: number }>()
    for (const tx of filtered) {
      if (tx.categoryId !== selected.id) continue
      const key = tx.subcategoryId ?? '__none'
      const current = map.get(key) ?? { amount: 0, count: 0 }
      current.amount += tx.amount
      current.count += 1
      map.set(key, current)
    }
    return [...map.entries()]
      .map(([id, data]) => {
        const subcategory =
          id === '__none'
            ? undefined
            : selectedCategory?.subcategories.find((sub) => sub.id === id)
        const visual = subcategoryVisual(subcategory, selectedCategory)
        return {
          id,
          name: subcategory?.name ?? 'Sin subcategoría',
          icon: visual.icon,
          color: visual.color,
          amount: data.amount,
          count: data.count,
          share: selected.amount ? (data.amount / selected.amount) * 100 : 0,
        }
      })
      .sort((a, b) => b.amount - a.amount)
  }, [filtered, selected, categoryMap])

  const topSubcategories = useMemo(() => {
    const map = new Map<
      string,
      { amount: number; count: number; categoryId: string; subId: string }
    >()
    for (const tx of filtered) {
      if (!tx.subcategoryId) continue
      const key = `${tx.categoryId}:${tx.subcategoryId}`
      const current = map.get(key) ?? {
        amount: 0,
        count: 0,
        categoryId: tx.categoryId,
        subId: tx.subcategoryId,
      }
      current.amount += tx.amount
      current.count += 1
      map.set(key, current)
    }
    return [...map.entries()]
      .map(([key, data]) => {
        const category = categoryMap.get(data.categoryId)
        const subcategory = category?.subcategories.find((sub) => sub.id === data.subId)
        const visual = subcategoryVisual(subcategory, category)
        return {
          key,
          categoryId: data.categoryId,
          name: subcategory?.name ?? 'Sin subcategoría',
          categoryName: category?.name ?? 'Sin categoría',
          icon: visual.icon,
          color: visual.color,
          amount: data.amount,
          count: data.count,
          share: total ? (data.amount / total) * 100 : 0,
        }
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6)
  }, [filtered, categoryMap, total])

  const trendEnd =
    mode === 'year' && year < nowYear
      ? `${year}-12`
      : mode === 'month'
        ? month
        : nowMonth

  const trendData = useMemo<CashflowPoint[]>(
    () =>
      lastNMonthKeys(6, trendEnd).map((key) => {
        const txs = transactions.filter((tx) => {
          if (walletId && tx.walletId !== walletId) return false
          if (tx.date > today) return false
          return monthKey(tx.date) === key
        })
        const sums = sumByType(txs)
        return {
          key,
          label: monthLabel(key, true).slice(0, 3),
          income: sums.income,
          expense: sums.expense,
        }
      }),
    [transactions, walletId, trendEnd, today],
  )

  const count = filtered.length
  const average = count ? total / count : 0
  const topCategory = categoryTotals[0]
  const typeLabel = type === 'income' ? 'ingresos' : 'gastos'

  const changeMode = (next: PeriodMode) => setMode(next)
  const shiftPeriod = (delta: number) =>
    setCursor((current) => addMonthsISO(current, mode === 'year' ? delta * 12 : delta))

  return (
    <div className="page-wrap space-y-4">
      <PageHeader
        eyebrow="Análisis"
        title="Estadísticas"
        subtitle={`${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} · ${periodLabel} · ${walletLabel}`}
      />

      <div className="card p-3 sm:p-4">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <Segmented
            value={mode}
            onChange={changeMode}
            options={[
              { value: 'month', label: 'Mes' },
              { value: 'year', label: 'Año' },
              { value: 'all', label: 'Todo' },
            ]}
          />

          {mode !== 'all' ? (
            <div className="flex h-10 items-center rounded-xl border border-line bg-surface2 p-0.5">
              <button
                type="button"
                onClick={() => shiftPeriod(-1)}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-fg"
                aria-label={mode === 'month' ? 'Mes anterior' : 'Año anterior'}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="min-w-[124px] px-2 text-center text-[12px] font-medium text-fg">
                {periodLabel}
              </span>
              <button
                type="button"
                onClick={() => shiftPeriod(1)}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-fg"
                aria-label={mode === 'month' ? 'Mes siguiente' : 'Año siguiente'}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          ) : (
            <span className="inline-flex h-10 items-center rounded-xl border border-line bg-surface2 px-3 text-[12px] font-medium text-muted">
              Todo el historial
            </span>
          )}

          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            <VisualSelect
              ariaLabel="Filtrar por billetera"
              value={walletId}
              onChange={setWalletId}
              compact
              className="w-[200px]"
              options={[
                { value: '', label: 'Todas las billeteras', icon: 'Wallet', color: '#64748b' },
                ...wallets.map((wallet) => ({
                  value: wallet.id,
                  label: wallet.name,
                  icon: wallet.icon,
                  color: wallet.color,
                })),
              ]}
            />

            <Segmented
              value={type}
              onChange={setType}
              options={[
                {
                  value: 'expense',
                  label: 'Gastos',
                  icon: <ArrowUpRight size={13} />,
                },
                {
                  value: 'income',
                  label: 'Ingresos',
                  icon: <ArrowDownLeft size={13} />,
                },
              ]}
            />
          </div>
        </div>
      </div>

      {count === 0 && (
        <div className="rounded-2xl border border-line bg-surface2/60 px-4 py-3 text-[12px] leading-relaxed text-muted">
          No hay {typeLabel} en <span className="font-medium text-fg">{periodLabel.toLowerCase()}</span>
          {walletId ? ` para ${walletLabel}` : ''}. Cambia el periodo, la billetera o el tipo
          de movimiento para ver datos.
        </div>
      )}

      {scheduledCount > 0 && (
        <div className="rounded-2xl border border-warn/20 bg-warn-soft px-4 py-3 text-[11.5px] leading-relaxed text-warn">
          Hay {scheduledCount} {type === 'income' ? 'ingreso' : 'gasto'}
          {scheduledCount === 1 ? '' : 's'} programado
          {scheduledCount === 1 ? '' : 's'} en este periodo. Se incluirán en las
          estadísticas cuando llegue su fecha.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={type === 'income' ? 'Total ingresado' : 'Total gastado'}
          value={formatMoney(total, currency)}
          meta={`${count} movimiento${count === 1 ? '' : 's'} · ${periodLabel}`}
          icon={type === 'income' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
          tone={type === 'income' ? 'income' : 'expense'}
          valueClassName={type === 'income' ? 'text-income' : 'text-expense'}
        />
        <StatCard
          label="Movimientos"
          value={String(count)}
          meta={`Promedio de ${count ? formatMoney(average, currency) : formatMoney(0, currency)}`}
          icon={<Receipt size={16} />}
          tone="brand"
        />
        <StatCard
          label="Categorías con actividad"
          value={String(categoryTotals.length)}
          meta={`${subcategoryRows.length} subcategoría${subcategoryRows.length === 1 ? '' : 's'} en la principal`}
          icon={<Tag size={16} />}
          tone="neutral"
        />
        <StatCard
          label="Mayor categoría"
          value={topCategory?.name ?? 'Sin datos'}
          meta={
            topCategory
              ? `${formatMoney(topCategory.amount, currency)} · ${formatPercent(topCategory.share, 1)}`
              : 'Añade movimientos para verla'
          }
          icon={<ChartPie size={16} />}
          tone="brand"
          valueClassName="text-[17px]"
        />
      </div>

      <section className="card p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="section-title">Análisis por categoría</h2>
            <p className="mt-0.5 text-[11px] text-muted">
              {type === 'income' ? 'Ingresos' : 'Gastos'} de {periodLabel.toLowerCase()} ·{' '}
              {categoryTotals.length} categoría{categoryTotals.length === 1 ? '' : 's'}
            </p>
          </div>
          <VisualSelect
            ariaLabel="Categoría a analizar"
            value={selected?.id ?? ''}
            onChange={setSelectedCategoryId}
            compact
            className="w-[200px]"
            options={categoryTotals.map((category) => ({
              value: category.id,
              label: category.name,
              icon: category.icon,
              color: category.color,
            }))}
            placeholder="Sin categorías"
            emptyLabel="No hay categorías con actividad."
            disabled={categoryTotals.length === 0}
          />
        </div>

        {categoryTotals.length > 0 ? (
          <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,236px)_minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-6">
            <div className="min-w-0">
              <CategoryDonut
                data={categoryTotals.map((category) => ({
                  id: category.id,
                  name: category.name,
                  value: category.amount,
                  color: category.color,
                }))}
                total={total}
                currency={currency}
                height={210}
                centerLabel={type === 'income' ? 'Ingresos' : 'Gastos'}
                activeId={selected?.id}
                onSelect={(id) => setSelectedCategoryId(id)}
              />
              <p className="mt-1 text-center text-[10px] text-faint">
                Pulsa un sector para ver su desglose
              </p>
            </div>

            <div className="min-w-0 lg:border-l lg:border-line lg:pl-6">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                  Categorías
                </p>
                <span className="text-[10px] text-faint">{categoryTotals.length}</span>
              </div>
              <div className="-mr-1 mt-2 max-h-[250px] space-y-0.5 overflow-y-auto pr-1">
                {categoryTotals.map((category) => {
                  const active = selected?.id === category.id
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(category.id)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition',
                        active ? 'bg-brand-soft' : 'hover:bg-surface2',
                      )}
                    >
                      <CategoryIcon
                        icon={category.icon}
                        color={category.color}
                        size={20}
                        radius={7}
                      />
                      <span
                        className={cn(
                          'min-w-0 flex-1 truncate text-[11.5px]',
                          active ? 'font-medium text-brand' : 'text-muted',
                        )}
                      >
                        {category.name}
                      </span>
                      <span className="w-10 shrink-0 text-right text-[10px] text-faint tnum">
                        {formatPercent(category.share, 0)}
                      </span>
                      <span className="w-[76px] shrink-0 text-right text-[11px] font-medium text-fg tnum">
                        {formatMoney(category.amount, currency)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="min-w-0 border-t border-line pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              {selected && (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                      Subcategorías
                    </p>
                    <span className="text-[10px] text-faint">
                      {selected.count} movimiento{selected.count === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center gap-2.5">
                    <CategoryIcon
                      icon={selected.icon}
                      color={selected.color}
                      size={36}
                      radius={12}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold text-fg">
                        {selected.name}
                      </p>
                      <p className="text-[10.5px] text-faint">
                        {formatPercent(selected.share, 1)} del total ·{' '}
                        {type === 'income' ? 'ingresado' : 'gastado'}
                      </p>
                    </div>
                    <p className="tnum shrink-0 text-[14px] font-semibold text-fg">
                      {formatMoney(selected.amount, currency)}
                    </p>
                  </div>

                  <div
                    className="-mr-1 mt-3 space-y-3 overflow-y-auto pr-1"
                    style={{ maxHeight: 195 }}
                  >
                    {subcategoryRows.map((sub, index) => (
                      <div key={sub.id}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex min-w-0 items-center gap-2">
                            <CategoryIcon
                              icon={sub.icon}
                              color={sub.color}
                              size={16}
                              radius={5}
                            />
                            <span className="truncate text-[11.5px] text-fg">
                              {sub.name}
                            </span>
                            <span className="shrink-0 text-[9.5px] text-faint">
                              ×{sub.count}
                            </span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="text-[11.5px] font-medium text-fg tnum">
                              {formatMoney(sub.amount, currency)}
                            </span>
                            <span className="ml-1.5 inline-block w-8 text-right text-[9.5px] text-faint tnum">
                              {formatPercent(sub.share, 0)}
                            </span>
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface2">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.max(2, sub.share)}%`,
                              backgroundColor: sub.color,
                              opacity: Math.max(0.4, 1 - index * 0.1),
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    {subcategoryRows.length === 0 && (
                      <p className="py-6 text-center text-[11.5px] text-faint">
                        No hay movimientos con subcategoría en este periodo.
                      </p>
                    )}
                  </div>

                  <p className="mt-3 border-t border-line pt-2.5 text-[10px] leading-relaxed text-faint">
                    Porcentajes sobre la categoría seleccionada y sobre el total de{' '}
                    {typeLabel} del periodo.
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl border border-line bg-surface2 text-faint">
              <ChartPie size={20} />
            </span>
            <p className="text-[13px] font-semibold text-fg">Sin datos que analizar</p>
            <p className="mt-1 max-w-xs text-[11.5px] leading-relaxed text-muted">
              Registra movimientos o cambia los filtros del periodo para ver el desglose.
            </p>
          </div>
        )}
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <section className="card p-4 sm:p-5 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="section-title">Evolución reciente</h2>
              <p className="mt-0.5 text-[11px] text-muted">
                Ingresos y gastos de los últimos 6 meses
                {walletId ? ` · ${walletLabel}` : ''}
              </p>
            </div>
            <ChartLegend
              items={[
                { label: 'Ingresos', color: '#10b981' },
                { label: 'Gastos', color: '#f43f5e' },
              ]}
            />
          </div>
          <div className="mt-2">
            <CashflowChart data={trendData} currency={currency} height={258} />
          </div>
        </section>

        <section className="card flex flex-col p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="section-title">Subcategorías destacadas</h2>
              <p className="mt-0.5 text-[11px] text-muted">Mayor importe del periodo</p>
            </div>
            <span
              className="grid h-8 w-8 place-items-center rounded-xl"
              style={{
                backgroundColor: hexToRgba(selected?.color ?? '#64748b', 0.14),
                color: selected?.color ?? '#64748b',
              }}
            >
              <Tag size={15} />
            </span>
          </div>

          {topSubcategories.length > 0 ? (
            <div className="mt-3 flex-1 space-y-2.5">
              {topSubcategories.map((sub) => (
                <button
                  key={sub.key}
                  type="button"
                  onClick={() => setSelectedCategoryId(sub.categoryId)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-1 py-1 text-left transition hover:bg-surface2"
                >
                  <CategoryIcon
                    icon={sub.icon}
                    color={sub.color}
                    size={20}
                    radius={7}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium text-fg">
                      {sub.name}
                    </span>
                    <span className="block truncate text-[10px] text-faint">
                      {sub.categoryName} · {sub.count} mov.
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[11.5px] font-medium text-fg tnum">
                      {formatMoney(sub.amount, currency)}
                    </span>
                    <span className="block text-[9.5px] text-faint tnum">
                      {formatPercent(sub.share, 1)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="flex flex-1 items-center justify-center py-8 text-center text-[11.5px] leading-relaxed text-faint">
              Aún no hay movimientos con subcategoría.
              <br />
              Añádelas desde la sección Categorías.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
