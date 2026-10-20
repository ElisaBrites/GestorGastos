import { useEffect, useState, type FormEvent } from 'react'
import { ArrowDownLeft, ArrowUpRight, Plus, Repeat } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useUI } from '../store/useUI'
import { addMonthsISO, todayISO } from '../lib/dates'
import { FREQUENCIES, FREQUENCY_LABELS, WALLET_TYPE_LABELS } from '../lib/defaults'
import { currencySymbol, parseAmount } from '../lib/format'
import { cn } from '../lib/utils'
import { subcategoryVisual } from '../lib/visuals'
import type { Frequency, Recurring, TxType } from '../types'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { Input, Select } from './ui/Input'
import { VisualSelect } from './ui/VisualSelect'
import { Toggle } from './ui/Toggle'
import { CategoryModal } from './CategoryModal'
import { SubcategoryModal } from './SubcategoryModal'

export function RecurringModal({
  open,
  onClose,
  item,
  defaultType = 'expense',
}: {
  open: boolean
  onClose: () => void
  item?: Recurring
  defaultType?: TxType
}) {
  const categories = useStore((state) => state.categories)
  const wallets = useStore((state) => state.wallets)
  const currency = useStore((state) => state.settings.currency)
  const addRecurring = useStore((state) => state.addRecurring)
  const updateRecurring = useStore((state) => state.updateRecurring)
  const toast = useUI((state) => state.toast)

  const [type, setType] = useState<TxType>('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [walletId, setWalletId] = useState('')
  const [note, setNote] = useState('')
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [nextDate, setNextDate] = useState(addMonthsISO(todayISO(), 1))
  const [endDate, setEndDate] = useState('')
  const [autoPost, setAutoPost] = useState(true)
  const [active, setActive] = useState(true)
  const [error, setError] = useState('')
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const initialType = item?.type ?? defaultType
    const category =
      categories.find((candidate) => candidate.id === item?.categoryId) ??
      categories.find((candidate) => candidate.type === initialType)
    setType(initialType)
    setAmount(item ? String(item.amount).replace('.', ',') : '')
    setCategoryId(category?.id ?? '')
    setSubcategoryId(item?.subcategoryId ?? '')
    setWalletId(item?.walletId ?? wallets[0]?.id ?? '')
    setNote(item?.note ?? '')
    setFrequency(item?.frequency ?? 'monthly')
    setNextDate(item?.nextDate ?? addMonthsISO(todayISO(), 1))
    setEndDate(item?.endDate ?? '')
    setAutoPost(item?.autoPost ?? true)
    setActive(item?.active ?? true)
    setError('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item, defaultType])

  useEffect(() => {
    if (open) return
    setCategoryModalOpen(false)
    setSubcategoryModalOpen(false)
  }, [open])

  const filteredCategories = categories.filter((category) => category.type === type)
  const selectedCategory = categories.find((category) => category.id === categoryId)
  const subs = selectedCategory?.subcategories ?? []

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
    const first = categories.find((category) => category.type === next)
    setCategoryId(first?.id ?? '')
    setSubcategoryId('')
  }

  const closeParent = () => {
    if (categoryModalOpen || subcategoryModalOpen) return
    onClose()
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
    if (!nextDate) {
      setError('Indica el próximo vencimiento.')
      return
    }
    if (endDate && endDate < nextDate) {
      setError('La fecha de fin no puede ser anterior al próximo vencimiento.')
      return
    }

    const payload = {
      type,
      amount: Math.round(value * 100) / 100,
      categoryId,
      subcategoryId: subcategoryId || undefined,
      walletId,
      note: note.trim() || undefined,
      frequency,
      nextDate,
      endDate: endDate || undefined,
      autoPost,
      active,
    }

    if (item) {
      updateRecurring(item.id, payload)
      toast('Movimiento fijo actualizado.')
    } else {
      addRecurring(payload)
      toast('Movimiento fijo programado.')
    }
    onClose()
  }

  const symbol = currencySymbol(currency)
  const formId = 'recurring-form'

  return (
    <>
      <Modal
        open={open}
        onClose={closeParent}
        title={item ? 'Editar movimiento fijo' : 'Nuevo movimiento fijo'}
        description={
          item
            ? 'Modifica el importe, la frecuencia o el modo de registro.'
            : 'Programa ingresos o gastos que se repiten en el tiempo.'
        }
        icon={
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
            <Repeat size={18} />
          </span>
        }
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" form={formId}>
              {item ? 'Guardar cambios' : 'Programar fijo'}
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
              Gasto fijo
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
              Ingreso fijo
            </button>
          </div>

          <div>
            <label className="label" htmlFor="recurring-amount">
              Importe
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-medium text-faint">
                {symbol}
              </span>
              <input
                id="recurring-amount"
                inputMode="decimal"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value)
                  setError('')
                }}
                placeholder="0,00"
                className={cn(
                  'field h-12 pl-10 text-[22px] font-semibold tnum',
                  type === 'income' ? 'text-income' : 'text-fg',
                )}
                autoFocus
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <VisualSelect
              label="Categoría"
              value={categoryId}
              onChange={(next) => {
                setCategoryId(next)
                setSubcategoryId('')
              }}
              options={categoryOptions}
              placeholder="Sin categorías"
              emptyLabel="No hay categorías para este tipo."
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
              onChange={setSubcategoryId}
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

          <div className="grid gap-3 sm:grid-cols-2">
            <VisualSelect
              label="Billetera"
              value={walletId}
              onChange={setWalletId}
              options={walletOptions}
              placeholder="Sin billeteras"
              emptyLabel="Crea una billetera primero."
            />
            <Select
              label="Frecuencia"
              value={frequency}
              onChange={(event) => setFrequency(event.target.value as Frequency)}
            >
              {FREQUENCIES.map((value) => (
                <option key={value} value={value}>
                  {FREQUENCY_LABELS[value]}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Próximo vencimiento"
              type="date"
              value={nextDate}
              onChange={(event) => setNextDate(event.target.value)}
              hint="Base para calcular las siguientes fechas."
            />
            <Input
              label="Fecha de fin (opcional)"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              hint="Déjalo vacío para que no termine."
            />
          </div>

          <Input
            label="Nota (opcional)"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Ej. Alquiler, nómina, gimnasio…"
            maxLength={80}
          />

          <div className="space-y-3 rounded-xl border border-line bg-surface2/60 p-3.5">
            <Toggle
              checked={autoPost}
              onChange={setAutoPost}
              label="Registro automático"
              description="Si está activo, el movimiento se añadirá solo al llegar la fecha."
            />
            <div className="border-t border-line" />
            <Toggle
              checked={active}
              onChange={setActive}
              label="Fijo activo"
              description="Pausa el fijo para dejar de programar nuevos registros."
            />
          </div>

          {error && (
            <p className="rounded-xl border border-expense/20 bg-expense-soft px-3 py-2 text-xs font-medium text-expense">
              {error}
            </p>
          )}
        </form>
      </Modal>

      <CategoryModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        defaultType={type}
        lockType
        onCreated={(id) => {
          setCategoryId(id)
          setSubcategoryId('')
        }}
      />

      <SubcategoryModal
        open={subcategoryModalOpen}
        onClose={() => setSubcategoryModalOpen(false)}
        category={selectedCategory}
        onCreated={(id) => setSubcategoryId(id)}
      />
    </>
  )
}
