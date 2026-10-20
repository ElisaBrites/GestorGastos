import { useEffect, useState, type FormEvent } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Plus,
  Trash2,
  Wallet as WalletIcon,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { useUI } from '../store/useUI'
import { walletBalance } from '../lib/calc'
import { formatFullDate, todayISO } from '../lib/dates'
import { WALLET_TYPE_LABELS } from '../lib/defaults'
import { currencySymbol, formatMoney, parseAmount } from '../lib/format'
import { subcategoryVisual } from '../lib/visuals'
import { cn } from '../lib/utils'
import type { TxType } from '../types'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { Input } from './ui/Input'
import { VisualSelect } from './ui/VisualSelect'
import { ConfirmDialog } from './ui/ConfirmDialog'
import { CategoryIcon } from './ui/CategoryIcon'
import { CategoryModal } from './CategoryModal'
import { SubcategoryModal } from './SubcategoryModal'

export function TransactionModal() {
  const { open, editId, defaultType } = useUI((state) => state.txModal)
  const close = useUI((state) => state.closeTransactionModal)
  const toast = useUI((state) => state.toast)

  const transactions = useStore((state) => state.transactions)
  const transfers = useStore((state) => state.transfers)
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
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false)

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

  useEffect(() => {
    if (open) return
    setCategoryModalOpen(false)
    setSubcategoryModalOpen(false)
  }, [open])

  const filteredCategories = categories.filter((item) => item.type === type)
  const selectedCategory = categories.find((item) => item.id === categoryId)
  const subs = selectedCategory?.subcategories ?? []
  const selectedSub = subs.find((sub) => sub.id === subcategoryId)
  const selectedVisual = subcategoryVisual(selectedSub, selectedCategory)
  const scheduled = Boolean(date) && date > todayISO()

  const walletOptions = wallets.map((wallet) => ({
    value: wallet.id,
    label: wallet.name,
    icon: wallet.icon,
    color: wallet.color,
    description: WALLET_TYPE_LABELS[wallet.type],
  }))

  const categoryOptions = filteredCategories.map((category) => ({
    value: category.id,
    label: category.name,
    icon: category.icon,
    color: category.color,
  }))

  const subcategoryOptions = [
    {
      value: '',
      label: 'Sin subcategoría',
      icon: 'Tag',
      color: selectedCategory?.color ?? '#94a3b8',
    },
    ...subs.map((sub) => {
      const visual = subcategoryVisual(sub, selectedCategory)
      return {
        value: sub.id,
        label: sub.name,
        icon: visual.icon,
        color: visual.color,
      }
    }),
  ]

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
        scheduled
          ? 'Movimiento programado.'
          : type === 'income'
            ? 'Ingreso registrado.'
            : 'Gasto registrado.',
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

  const closeParent = () => {
    if (categoryModalOpen || subcategoryModalOpen || confirmDelete) return
    close()
  }

  const symbol = currencySymbol(currency)
  const formId = 'transaction-form'

  return (
    <>
      <Modal
        open={open}
        onClose={closeParent}
        title={editing ? 'Editar movimiento' : 'Nuevo movimiento'}
        description={
          editing
            ? 'Ajusta los datos del movimiento seleccionado.'
            : 'Registra un gasto o ingreso. Si eliges una fecha futura quedará programado.'
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
              {editing ? 'Guardar cambios' : scheduled ? 'Programar movimiento' : 'Añadir movimiento'}
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
                  return wallet ? walletBalance(wallet, transactions, transfers) : 0
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
            <VisualSelect
              label="Billetera"
              value={walletId}
              onChange={(next) => {
                setWalletId(next)
                setError('')
              }}
              options={walletOptions}
              placeholder="Sin billeteras"
              emptyLabel="Crea una billetera desde la sección Billeteras."
            />
          </div>

          {scheduled && (
            <div className="flex items-start gap-2.5 rounded-xl border border-warn/20 bg-warn-soft px-3 py-2.5 text-[11px] leading-relaxed text-warn">
              <Clock3 size={14} className="mt-0.5 shrink-0" />
              <span>
                Este movimiento quedará programado para el {formatFullDate(date)}. No
                afectará al balance actual ni a las estadísticas hasta ese día.
              </span>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <VisualSelect
              label="Categoría"
              value={categoryId}
              onChange={(next) => {
                setCategoryId(next)
                setSubcategoryId('')
                setError('')
              }}
              options={categoryOptions}
              placeholder={
                filteredCategories.length === 0
                  ? `Sin categorías de ${type === 'income' ? 'ingreso' : 'gasto'}`
                  : 'Selecciona una categoría'
              }
              emptyLabel="No hay categorías para este tipo. Usa «+ Nueva»."
              action={
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(true)}
                  className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[10.5px] font-medium text-brand transition hover:bg-brand-soft"
                >
                  <Plus size={11} />
                  Nueva
                </button>
              }
            />
            <VisualSelect
              label="Subcategoría"
              value={subcategoryId}
              onChange={(next) => {
                setSubcategoryId(next)
                setError('')
              }}
              options={subcategoryOptions}
              placeholder="Sin subcategoría"
              action={
                <button
                  type="button"
                  onClick={() => setSubcategoryModalOpen(true)}
                  disabled={!selectedCategory}
                  className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[10.5px] font-medium text-brand transition hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={11} />
                  Nueva
                </button>
              }
            />
          </div>

          {filteredCategories.length === 0 && (
            <p className="rounded-xl border border-warn/20 bg-warn-soft px-3 py-2 text-xs text-warn">
              No hay categorías para este tipo. Crea una desde este formulario con
              «+ Nueva».
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
                  <CategoryIcon
                    icon={selectedVisual.icon}
                    color={selectedVisual.color}
                    size={20}
                    radius={6}
                  />
                  {selectedCategory.name}
                  {selectedSub && (
                    <span className="text-faint">· {selectedSub.name}</span>
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

      <CategoryModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        defaultType={type}
        lockType
        onCreated={(id) => {
          setCategoryId(id)
          setSubcategoryId('')
          setError('')
        }}
      />

      <SubcategoryModal
        open={subcategoryModalOpen}
        onClose={() => setSubcategoryModalOpen(false)}
        category={selectedCategory}
        onCreated={(id) => {
          setSubcategoryId(id)
          setError('')
        }}
      />
    </>
  )
}
