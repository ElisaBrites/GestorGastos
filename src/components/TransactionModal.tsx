import { useEffect, useState, type FormEvent } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Trash2,
  Wallet as WalletIcon,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { useUI } from '../store/useUI'
import { walletBalance } from '../lib/calc'
import { todayISO } from '../lib/dates'
import { currencySymbol, formatMoney, parseAmount } from '../lib/format'
import { cn } from '../lib/utils'
import type { TxType } from '../types'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { Select, Input } from './ui/Input'
import { ConfirmDialog } from './ui/ConfirmDialog'
import { CategoryIcon } from './ui/CategoryIcon'

export function TransactionModal() {
  const { open, editId, defaultType } = useUI((state) => state.txModal)
  const close = useUI((state) => state.closeTransactionModal)
  const toast = useUI((state) => state.toast)

  const transactions = useStore((state) => state.transactions)
  const categories = useStore((state) => state.categories)
  const wallets = useStore((state) => state.wallets)
  const currency = useStore((state) => state.settings.currency)
  const addTransaction = useStore((state) => state.addTransaction)
  const updateTransaction = useStore((state) => state.updateTransaction)
  const deleteTransaction = useStore((state) => state.deleteTransaction)

  const editing = editId ? transactions.find((tx) => tx.id === editId) : undefined

  const [type, setType] = useState<TxType>('expense')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayISO())
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [walletId, setWalletId] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!open) return
    const initialType = editing?.type ?? defaultType ?? 'expense'
    const cat =
      categories.find((item) => item.id === editing?.categoryId) ??
      categories.find((item) => item.type === initialType)
    setType(initialType)
    setAmount(editing ? String(editing.amount).replace('.', ',') : '')
    setDate(editing?.date ?? todayISO())
    setCategoryId(cat?.id ?? '')
    setSubcategoryId(editing?.subcategoryId ?? '')
    setWalletId(editing?.walletId ?? wallets[0]?.id ?? '')
    setNote(editing?.note ?? '')
    setError('')
    setConfirmDelete(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editId, defaultType])

  const filteredCategories = categories.filter((item) => item.type === type)
  const selectedCategory = categories.find((item) => item.id === categoryId)
  const subs = selectedCategory?.subcategories ?? []

  const changeType = (next: TxType) => {
    if (next === type) return
    setType(next)
    const first = categories.find((item) => item.type === next)
    setCategoryId(first?.id ?? '')
    setSubcategoryId('')
    setError('')
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const value = parseAmount(amount)
    if (!value || value <= 0) {
      setError('Introduce un importe mayor que cero.')
      return
    }
    if (!categoryId) {
      setError('Selecciona una categoría.')
      return
    }
    if (!walletId) {
      setError('Selecciona una billetera.')
      return
    }
    if (!date) {
      setError('Selecciona una fecha.')
      return
    }

    const payload = {
      type,
      amount: Math.round(value * 100) / 100,
      date,
      categoryId,
      subcategoryId: subcategoryId || undefined,
      walletId,
      note: note.trim() || undefined,
    }

    if (editing) {
      updateTransaction(editing.id, payload)
      toast('Movimiento actualizado.')
    } else {
      addTransaction(payload)
      toast(
        type === 'income' ? 'Ingreso registrado.' : 'Gasto registrado.',
        'success',
      )
    }
    close()
  }

  const handleDelete = () => {
    if (!editing) return
    deleteTransaction(editing.id)
    toast('Movimiento eliminado.')
    close()
  }

  const symbol = currencySymbol(currency)
  const formId = 'transaction-form'

  return (
    <>
      <Modal
        open={open}
        onClose={close}
        title={editing ? 'Editar movimiento' : 'Nuevo movimiento'}
        description={
          editing
            ? 'Ajusta los datos del movimiento seleccionado.'
            : 'Registra un gasto o ingreso y asígnalo a una billetera.'
        }
        size="md"
        icon={
          <span
            className={cn(
              'grid h-9 w-9 place-items-center rounded-xl',
              type === 'income'
                ? 'bg-income-soft text-income'
                : 'bg-expense-soft text-expense',
            )}
          >
            {type === 'income' ? (
              <ArrowDownLeft size={18} strokeWidth={2.3} />
            ) : (
              <ArrowUpRight size={18} strokeWidth={2.3} />
            )}
          </span>
        }
        footer={
          <>
            {editing && (
              <Button
                variant="ghost"
                className="mr-auto gap-1.5 text-expense hover:bg-expense-soft hover:text-expense"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 size={15} />
                Eliminar
              </Button>
            )}
            <Button variant="secondary" onClick={close}>
              Cancelar
            </Button>
            <Button type="submit" form={formId}>
              {editing ? 'Guardar cambios' : 'Añadir movimiento'}
            </Button>
          </>
        }
      >
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-surface2 p-1.5">
            <button
              type="button"
              onClick={() => changeType('expense')}
              className={cn(
                'flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition',
                type === 'expense'
                  ? 'bg-surface text-expense shadow-sm ring-1 ring-expense/20'
                  : 'text-muted hover:text-fg',
              )}
            >
              <ArrowUpRight size={16} />
              Gasto
            </button>
            <button
              type="button"
              onClick={() => changeType('income')}
              className={cn(
                'flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition',
                type === 'income'
                  ? 'bg-surface text-income shadow-sm ring-1 ring-income/20'
                  : 'text-muted hover:text-fg',
              )}
            >
              <ArrowDownLeft size={16} />
              Ingreso
            </button>
          </div>

          <div>
            <label className="label" htmlFor="tx-amount">
              Importe
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-medium text-faint">
                {symbol}
              </span>
              <input
                id="tx-amount"
                inputMode="decimal"
                autoComplete="off"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value)
                  setError('')
                }}
                placeholder="0,00"
                className={cn(
                  'field h-14 pl-10 text-[24px] font-semibold tnum',
                  type === 'income' ? 'text-income' : 'text-fg',
                )}
                autoFocus
              />
            </div>
            <p className="mt-1.5 text-[11px] text-faint">
              Saldo actual de la billetera:{' '}
              {formatMoney(
                (() => {
                  const wallet = wallets.find((item) => item.id === walletId)
                  return wallet ? walletBalance(wallet, transactions) : 0
                })(),
                currency,
              )}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Fecha"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
            <Select
              label="Billetera"
              value={walletId}
              onChange={(event) => setWalletId(event.target.value)}
            >
              {wallets.length === 0 && <option value="">Sin billeteras</option>}
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Categoría"
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value)
                setSubcategoryId('')
              }}
            >
              {filteredCategories.length === 0 && (
                <option value="">Sin categorías de {type === 'income' ? 'ingreso' : 'gasto'}</option>
              )}
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            <Select
              label="Subcategoría"
              value={subcategoryId}
              onChange={(event) => setSubcategoryId(event.target.value)}
              disabled={subs.length === 0}
            >
              <option value="">Sin subcategoría</option>
              {subs.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </Select>
          </div>

          {filteredCategories.length === 0 && (
            <p className="rounded-xl border border-warn/20 bg-warn-soft px-3 py-2 text-xs text-warn">
              No hay categorías para este tipo. Créalas desde la sección Categorías.
            </p>
          )}

          <Input
            label="Nota (opcional)"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Ej. Cena con amigos"
            maxLength={120}
          />

          {error && (
            <p className="rounded-xl border border-expense/20 bg-expense-soft px-3 py-2 text-xs font-medium text-expense">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 rounded-xl border border-line bg-surface2/60 px-3 py-2.5 text-[11px] text-muted">
            <CalendarDays size={14} className="shrink-0 text-faint" />
            <span className="flex-1">
              {selectedCategory ? (
                <span className="flex items-center gap-2">
                  <CategoryIcon icon={selectedCategory.icon} color={selectedCategory.color} size={20} radius={6} />
                  {selectedCategory.name}
                  {subs.find((sub) => sub.id === subcategoryId) && (
                    <span className="text-faint">
                      · {subs.find((sub) => sub.id === subcategoryId)?.name}
                    </span>
                  )}
                </span>
              ) : (
                'Selecciona una categoría'
              )}
            </span>
            <span className="flex items-center gap-1.5">
              <WalletIcon size={13} className="text-faint" />
              {wallets.find((wallet) => wallet.id === walletId)?.name ?? 'Sin billetera'}
            </span>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Eliminar movimiento"
        description="Esta acción no se puede deshacer. El importe dejará de contar en tus estadísticas y saldos."
        confirmLabel="Eliminar"
      />
    </>
  )
}
