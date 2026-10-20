import { useMemo, useState } from 'react'
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { useUI } from '../store/useUI'
import { groupByDate, sumByType } from '../lib/calc'
import {
  currentMonthKey,
  monthKey,
  monthLabel,
  relativeGroupLabel,
  shiftMonthKey,
} from '../lib/dates'
import { formatMoney } from '../lib/format'
import { cn } from '../lib/utils'
import type { TxType } from '../types'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Segmented } from '../components/ui/Segmented'
import { EmptyState } from '../components/ui/EmptyState'
import { TransactionRow } from '../components/TransactionRow'
import { Select } from '../components/ui/Input'

type TypeFilter = 'all' | TxType

export function Transactions() {
  const transactions = useStore((state) => state.transactions)
  const categories = useStore((state) => state.categories)
  const wallets = useStore((state) => state.wallets)
  const currency = useStore((state) => state.settings.currency)
  const openTransactionModal = useUI((state) => state.openTransactionModal)

  const [search, setSearch] = useState('')
  const [type, setType] = useState<TypeFilter>('all')
  const [walletId, setWalletId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [month, setMonth] = useState<string>(currentMonthKey())
  const [allTime, setAllTime] = useState(false)

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  )
  const walletMap = useMemo(
    () => new Map(wallets.map((wallet) => [wallet.id, wallet])),
    [wallets],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return transactions.filter((tx) => {
      if (type !== 'all' && tx.type !== type) return false
      if (walletId && tx.walletId !== walletId) return false
      if (categoryId && tx.categoryId !== categoryId) return false
      if (!allTime && monthKey(tx.date) !== month) return false
      if (!term) return true
      const category = categoryMap.get(tx.categoryId)
      const sub = category?.subcategories.find((item) => item.id === tx.subcategoryId)
      const wallet = walletMap.get(tx.walletId)
      const haystack = [
        category?.name,
        sub?.name,
        wallet?.name,
        tx.note,
        String(tx.amount),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [transactions, type, walletId, categoryId, allTime, month, search, categoryMap, walletMap])

  const totals = useMemo(() => sumByType(filtered), [filtered])
  const grouped = useMemo(() => groupByDate(filtered), [filtered])

  const visibleCategories = categories.filter(
    (category) => type === 'all' || category.type === type,
  )
  const filtersActive = Boolean(
    search || type !== 'all' || walletId || categoryId || allTime,
  )

  const clearFilters = () => {
    setSearch('')
    setType('all')
    setWalletId('')
    setCategoryId('')
    setAllTime(false)
    setMonth(currentMonthKey())
  }

  const changeType = (next: TypeFilter) => {
    setType(next)
    if (categoryId) {
      const category = categoryMap.get(categoryId)
      if (next !== 'all' && category?.type !== next) setCategoryId('')
    }
  }

  const moveMonth = (delta: number) => {
    if (allTime) {
      setAllTime(false)
      setMonth(currentMonthKey())
      return
    }
    setMonth((current) => shiftMonthKey(current, delta))
  }

  return (
    <div className="page-wrap space-y-4">
      <PageHeader
        eyebrow="Registro"
        title="Movimientos"
        subtitle={`${filtered.length} movimiento${filtered.length === 1 ? '' : 's'} · ${allTime ? 'todo el historial' : monthLabel(month)}`}
        actions={
          <Button onClick={() => openTransactionModal()}>
            <Plus size={16} strokeWidth={2.4} />
            Nuevo movimiento
          </Button>
        }
      />

      <div className="card p-3 sm:p-4">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nota, categoría, billetera…"
                className="field h-10 pl-9 pr-9"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-faint transition hover:bg-surface2 hover:text-fg"
                  aria-label="Borrar búsqueda"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <Segmented
              value={type}
              onChange={changeType}
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'expense', label: 'Gastos' },
                { value: 'income', label: 'Ingresos' },
              ]}
            />

            <div className="flex items-center gap-2">
              <div className="flex h-10 items-center rounded-xl border border-line bg-surface2 p-0.5">
                <button
                  type="button"
                  onClick={() => moveMonth(-1)}
                  className="grid h-8 w-7 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-fg"
                  aria-label="Mes anterior"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setAllTime((value) => !value)}
                  className={cn(
                    'min-w-[112px] rounded-lg px-2 text-center text-[11.5px] font-medium transition',
                    allTime ? 'bg-brand-soft py-1.5 text-brand' : 'text-fg hover:bg-surface',
                  )}
                  title="Cambiar entre mes e historial completo"
                >
                  {allTime ? 'Todo el historial' : monthLabel(month)}
                </button>
                <button
                  type="button"
                  onClick={() => moveMonth(1)}
                  className="grid h-8 w-7 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-fg"
                  aria-label="Mes siguiente"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-2.5">
            <span className="flex items-center gap-1.5 pr-1 text-[11px] font-medium text-faint">
              <SlidersHorizontal size={13} />
              Filtros
            </span>
            <Select
              value={walletId}
              onChange={(event) => setWalletId(event.target.value)}
              className="h-9 w-auto min-w-[150px] py-0 text-xs"
            >
              <option value="">Todas las billeteras</option>
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.name}
                </option>
              ))}
            </Select>
            <Select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="h-9 w-auto min-w-[150px] py-0 text-xs"
            >
              <option value="">Todas las categorías</option>
              {visibleCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-muted transition hover:bg-surface2 hover:text-fg"
              >
                <X size={12} />
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card grid grid-cols-3 divide-x divide-line overflow-hidden">
        <div className="px-4 py-3.5">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-faint">
            Ingresos
          </p>
          <p className="mt-1 truncate text-[15px] font-semibold text-income tnum sm:text-[18px]">
            {formatMoney(totals.income, currency)}
          </p>
        </div>
        <div className="px-4 py-3.5">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-faint">
            Gastos
          </p>
          <p className="mt-1 truncate text-[15px] font-semibold text-expense tnum sm:text-[18px]">
            {formatMoney(totals.expense, currency)}
          </p>
        </div>
        <div className="px-4 py-3.5">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-faint">
            Balance
          </p>
          <p
            className={cn(
              'mt-1 truncate text-[15px] font-semibold tnum sm:text-[18px]',
              totals.net >= 0 ? 'text-fg' : 'text-expense',
            )}
          >
            {formatMoney(totals.net, currency)}
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        {grouped.size > 0 ? (
          <div>
            {[...grouped.entries()].map(([date, items]) => {
              const day = sumByType(items)
              return (
                <div key={date}>
                  <div className="flex items-center justify-between gap-3 border-b border-line bg-surface2/60 px-4 py-2">
                    <p className="text-[11.5px] font-semibold text-fg">
                      {relativeGroupLabel(date)}
                    </p>
                    <div className="flex items-center gap-3 text-[10.5px] tnum">
                      {day.income > 0 && (
                        <span className="text-income">
                          +{formatMoney(day.income, currency)}
                        </span>
                      )}
                      {day.expense > 0 && (
                        <span className="text-muted">
                          −{formatMoney(day.expense, currency)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="divide-y divide-line px-2">
                    {items.map((tx) => (
                      <TransactionRow
                        key={tx.id}
                        transaction={tx}
                        category={categoryMap.get(tx.categoryId)}
                        wallet={walletMap.get(tx.walletId)}
                        currency={currency}
                        onClick={() => openTransactionModal({ editId: tx.id })}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyState
            icon={<ArrowLeftRight size={20} />}
            title={filtersActive ? 'No hay resultados' : 'Sin movimientos este mes'}
            description={
              filtersActive
                ? 'Prueba con otros filtros o busca en todo el historial.'
                : 'Registra tu primer gasto o ingreso para empezar a ver tus finanzas.'
            }
            action={
              filtersActive ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              ) : (
                <Button size="sm" onClick={() => openTransactionModal()}>
                  <Plus size={14} />
                  Añadir movimiento
                </Button>
              )
            }
          />
        )}
      </div>
    </div>
  )
}
