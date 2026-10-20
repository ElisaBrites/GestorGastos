import { useMemo, useState } from 'react'
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { useUI } from '../store/useUI'
import { sumByType } from '../lib/calc'
import {
  currentMonthKey,
  monthKey,
  monthLabel,
  relativeGroupLabel,
  shiftMonthKey,
  todayISO,
} from '../lib/dates'
import { formatMoney } from '../lib/format'
import { cn } from '../lib/utils'
import type { Transaction, Transfer, TxType } from '../types'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Segmented } from '../components/ui/Segmented'
import { EmptyState } from '../components/ui/EmptyState'
import { TransactionRow } from '../components/TransactionRow'
import { TransferRow } from '../components/TransferRow'
import { VisualSelect } from '../components/ui/VisualSelect'

type TypeFilter = 'all' | TxType

type MovementItem =
  | { kind: 'tx'; id: string; date: string; createdAt: string; tx: Transaction }
  | {
      kind: 'transfer'
      id: string
      date: string
      createdAt: string
      transfer: Transfer
    }

export function Transactions() {
  const transactions = useStore((state) => state.transactions)
  const transfers = useStore((state) => state.transfers)
  const categories = useStore((state) => state.categories)
  const wallets = useStore((state) => state.wallets)
  const currency = useStore((state) => state.settings.currency)
  const openTransactionModal = useUI((state) => state.openTransactionModal)
  const openTransferModal = useUI((state) => state.openTransferModal)

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

  const filteredTransfers = useMemo(() => {
    if (type !== 'all' || categoryId) return []
    const term = search.trim().toLowerCase()
    return transfers.filter((transfer) => {
      if (
        walletId &&
        transfer.fromWalletId !== walletId &&
        transfer.toWalletId !== walletId
      ) {
        return false
      }
      if (!allTime && monthKey(transfer.date) !== month) return false
      if (!term) return true
      const from = walletMap.get(transfer.fromWalletId)?.name
      const to = walletMap.get(transfer.toWalletId)?.name
      const haystack = [
        'transferencia',
        from,
        to,
        transfer.note,
        String(transfer.amount),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [transfers, type, categoryId, walletId, allTime, month, search, walletMap])

  const today = todayISO()
  const totals = useMemo(
    () => sumByType(filtered.filter((tx) => tx.date <= today)),
    [filtered, today],
  )
  const scheduledCount =
    filtered.filter((tx) => tx.date > today).length +
    filteredTransfers.filter((transfer) => transfer.date > today).length

  const grouped = useMemo(() => {
    const items: MovementItem[] = [
      ...filtered.map((tx) => ({
        kind: 'tx' as const,
        id: tx.id,
        date: tx.date,
        createdAt: tx.createdAt,
        tx,
      })),
      ...filteredTransfers.map((transfer) => ({
        kind: 'transfer' as const,
        id: transfer.id,
        date: transfer.date,
        createdAt: transfer.createdAt,
        transfer,
      })),
    ].sort((a, b) => {
      if (a.date === b.date) return a.createdAt < b.createdAt ? 1 : -1
      return a.date < b.date ? 1 : -1
    })

    const map = new Map<string, MovementItem[]>()
    for (const item of items) {
      const list = map.get(item.date) ?? []
      list.push(item)
      map.set(item.date, list)
    }
    return map
  }, [filtered, filteredTransfers])

  const visibleCategories = categories.filter(
    (category) => type === 'all' || category.type === type,
  )
  const movementCount = filtered.length + filteredTransfers.length
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
        subtitle={`${movementCount} movimiento${movementCount === 1 ? '' : 's'} · ${allTime ? 'todo el historial' : monthLabel(month)}`}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => openTransferModal()}
              disabled={wallets.length < 2}
            >
              <ArrowLeftRight size={15} />
              Transferir
            </Button>
            <Button onClick={() => openTransactionModal()}>
              <Plus size={16} strokeWidth={2.4} />
              Nuevo movimiento
            </Button>
          </>
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
            <VisualSelect
              ariaLabel="Filtrar por categoría"
              value={categoryId}
              onChange={setCategoryId}
              compact
              className="w-[200px]"
              options={[
                { value: '', label: 'Todas las categorías', icon: 'Tag', color: '#64748b' },
                ...visibleCategories.map((category) => ({
                  value: category.id,
                  label: category.name,
                  icon: category.icon,
                  color: category.color,
                })),
              ]}
            />
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

      {scheduledCount > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl border border-warn/20 bg-warn-soft px-3.5 py-2.5 text-[11px] leading-relaxed text-warn">
          <Clock3 size={14} className="mt-0.5 shrink-0" />
          <span>
            Esta vista incluye {scheduledCount} movimiento
            {scheduledCount === 1 ? '' : 's'} programado
            {scheduledCount === 1 ? '' : 's'}. No se contabilizan en los totales ni en
            los saldos hasta que llegue su fecha.
          </span>
        </div>
      )}

      <div className="card overflow-hidden">
        {grouped.size > 0 ? (
          <div>
            {[...grouped.entries()].map(([date, items]) => {
              const day = sumByType(
                items.flatMap((item) => (item.kind === 'tx' ? [item.tx] : [])),
              )
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
                    {items.map((item) =>
                      item.kind === 'tx' ? (
                        <TransactionRow
                          key={item.id}
                          transaction={item.tx}
                          category={categoryMap.get(item.tx.categoryId)}
                          wallet={walletMap.get(item.tx.walletId)}
                          currency={currency}
                          onClick={() => openTransactionModal({ editId: item.id })}
                        />
                      ) : (
                        <TransferRow
                          key={item.id}
                          transfer={item.transfer}
                          fromWallet={walletMap.get(item.transfer.fromWalletId)}
                          toWallet={walletMap.get(item.transfer.toWalletId)}
                          currency={currency}
                          onClick={() => openTransferModal({ editId: item.id })}
                        />
                      ),
                    )}
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
