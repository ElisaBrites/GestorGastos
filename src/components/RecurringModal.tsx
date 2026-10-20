import { useEffect, useState, type FormEvent } from 'react'
import { ArrowDownLeft, ArrowUpRight, Repeat } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useUI } from '../store/useUI'
import { addMonthsISO, todayISO } from '../lib/dates'
import { FREQUENCIES, FREQUENCY_LABELS } from '../lib/defaults'
import { currencySymbol, parseAmount } from '../lib/format'
import { cn } from '../lib/utils'
import type { Frequency, Recurring, TxType } from '../types'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { Input, Select } from './ui/Input'
import { Toggle } from './ui/Toggle'

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

  const filteredCategories = categories.filter((category) => category.type === type)
  const selectedCategory = categories.find((category) => category.id === categoryId)
  const subs = selectedCategory?.subcategories ?? []

  const changeType = (next: TxType) => {
    if (next === type) return
    setType(next)
    const first = categories.find((category) => category.type === next)
    setCategoryId(first?.id ?? '')
    setSubcategoryId('')
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
    <Modal
      open={open}
      onClose={onClose}
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
          <Select
            label="Categoría"
            value={categoryId}
            onChange={(event) => {
              setCategoryId(event.target.value)
              setSubcategoryId('')
            }}
          >
            {filteredCategories.length === 0 && <option value="">Sin categorías</option>}
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

        <div className="grid gap-3 sm:grid-cols-2">
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
  )
}
