import { useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Pencil,
  Plus,
  Trash2,
  WalletCards,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { useUI } from '../store/useUI'
import { sumByType, walletBalances } from '../lib/calc'
import { currentMonthKey, monthKey } from '../lib/dates'
import { WALLET_TYPE_LABELS } from '../lib/defaults'
import { formatMoney } from '../lib/format'
import { hexToRgba } from '../lib/utils'
import type { Wallet } from '../types'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { CategoryIcon } from '../components/ui/CategoryIcon'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { WalletModal } from '../components/WalletModal'

export function Wallets() {
  const wallets = useStore((state) => state.wallets)
  const transactions = useStore((state) => state.transactions)
  const currency = useStore((state) => state.settings.currency)
  const deleteWallet = useStore((state) => state.deleteWallet)
  const toast = useUI((state) => state.toast)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Wallet | undefined>()
  const [deleting, setDeleting] = useState<Wallet | undefined>()

  const month = currentMonthKey()

  const balances = useMemo(
    () => walletBalances(wallets, transactions),
    [wallets, transactions],
  )
  const walletStats = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>()
    for (const wallet of wallets) {
      const txs = transactions.filter(
        (tx) => tx.walletId === wallet.id && monthKey(tx.date) === month,
      )
      map.set(wallet.id, sumByType(txs))
    }
    return map
  }, [wallets, transactions, month])

  const totalBalance = wallets.reduce(
    (sum, wallet) => sum + (balances.get(wallet.id) ?? 0),
    0,
  )
  const monthTotals = useMemo(
    () => sumByType(transactions.filter((tx) => monthKey(tx.date) === month)),
    [transactions, month],
  )

  const openCreate = () => {
    setEditing(undefined)
    setModalOpen(true)
  }
  const openEdit = (wallet: Wallet) => {
    setEditing(wallet)
    setModalOpen(true)
  }

  const handleDelete = () => {
    if (!deleting) return
    const result = deleteWallet(deleting.id)
    if (result.ok) toast('Billetera eliminada.')
    else toast(result.error, 'error')
  }

  return (
    <div className="page-wrap space-y-4">
      <PageHeader
        eyebrow="Organización"
        title="Billeteras"
        subtitle="Separa tu dinero en efectivo, cuentas, tarjetas y ahorros."
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} strokeWidth={2.4} />
            Nueva billetera
          </Button>
        }
      />

      <div className="card overflow-hidden">
        <div className="grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex items-center gap-4 p-5">
            <span className="gradient-brand grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white shadow-[0_10px_24px_-14px_rgba(99,85,242,0.9)]">
              <WalletCards size={20} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">
                Balance total
              </p>
              <p className="mt-0.5 truncate text-[22px] font-semibold leading-tight tracking-[-0.03em] tnum">
                {formatMoney(totalBalance, currency)}
              </p>
              <p className="text-[11px] text-faint">
                {wallets.length} billetera{wallets.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-income-soft text-income">
              <ArrowDownLeft size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">
                Ingresos este mes
              </p>
              <p className="mt-0.5 truncate text-[19px] font-semibold text-income tnum">
                {formatMoney(monthTotals.income, currency)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-expense-soft text-expense">
              <ArrowUpRight size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">
                Gastos este mes
              </p>
              <p className="mt-0.5 truncate text-[19px] font-semibold text-expense tnum">
                {formatMoney(monthTotals.expense, currency)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {wallets.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<WalletCards size={20} />}
            title="Sin billeteras"
            description="Crea tu primera billetera para empezar a registrar movimientos y ver saldos separados."
            action={
              <Button size="sm" onClick={openCreate}>
                <Plus size={14} />
                Nueva billetera
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {wallets.map((wallet) => {
            const stats = walletStats.get(wallet.id) ?? { income: 0, expense: 0 }
            const balance = balances.get(wallet.id) ?? 0
            return (
              <div
                key={wallet.id}
                className="card group relative overflow-hidden p-5 transition hover:border-line-strong"
              >
                <div
                  className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full blur-2xl"
                  style={{ backgroundColor: hexToRgba(wallet.color, 0.22) }}
                />
                <div className="relative flex items-start gap-3">
                  <CategoryIcon
                    icon={wallet.icon}
                    color={wallet.color}
                    size={44}
                    radius={14}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-fg">{wallet.name}</p>
                    <p className="text-[11px] text-faint">
                      {WALLET_TYPE_LABELS[wallet.type]}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(wallet)}
                      className="grid h-7 w-7 place-items-center rounded-lg text-faint transition hover:bg-surface2 hover:text-fg"
                      aria-label={`Editar ${wallet.name}`}
                      title="Editar"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(wallet)}
                      className="grid h-7 w-7 place-items-center rounded-lg text-faint transition hover:bg-expense-soft hover:text-expense"
                      aria-label={`Eliminar ${wallet.name}`}
                      title="Eliminar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="relative mt-5">
                  <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-faint">
                    Saldo actual
                  </p>
                  <p
                    className={`mt-1 truncate text-[24px] font-semibold leading-none tracking-[-0.03em] tnum ${
                      balance < 0 ? 'text-expense' : 'text-fg'
                    }`}
                  >
                    {formatMoney(balance, currency)}
                  </p>
                </div>

                <div className="relative mt-4 grid grid-cols-2 gap-2 border-t border-line pt-3">
                  <div>
                    <p className="text-[10px] text-faint">Ingresos del mes</p>
                    <p className="mt-0.5 truncate text-[12px] font-semibold text-income tnum">
                      +{formatMoney(stats.income, currency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-faint">Gastos del mes</p>
                    <p className="mt-0.5 truncate text-[12px] font-semibold text-muted tnum">
                      −{formatMoney(stats.expense, currency)}
                    </p>
                  </div>
                </div>
                <div className="relative mt-2 flex items-center justify-between text-[10px] text-faint">
                  <span>Saldo inicial</span>
                  <span className="tnum">{formatMoney(wallet.initialBalance, currency)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <WalletModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        wallet={editing}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(undefined)}
        onConfirm={handleDelete}
        title="Eliminar billetera"
        description={`Vas a eliminar «${deleting?.name ?? ''}». Solo es posible si no tiene movimientos ni fijos asociados.`}
        confirmLabel="Eliminar billetera"
      />
    </div>
  )
}
