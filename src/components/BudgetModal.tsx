import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { CalendarRange, PiggyBank } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useUI } from '../store/useUI'
import {
  monthKey,
  monthRange,
  shiftMonthKey,
  todayISO,
  yearRange,
} from '../lib/dates'
import { formatMoney } from '../lib/format'
import { cn } from '../lib/utils'
import type { Budget } from '../types'
import { Button } from './ui/Button'
import { Input, Select } from './ui/Input'
import { CategoryIcon } from './ui/CategoryIcon'
import { Modal } from './ui/Modal'

type PeriodPreset = 'month' | 'quarter' | 'year' | 'custom'

function periodPresets(baseDate: string) {
  const month = monthRange(monthKey(baseDate))
  return {
    month,
    quarter: {
      start: month.start,
      end: monthRange(shiftMonthKey(monthKey(baseDate), 2)).end,
    },
    year: yearRange(Number(baseDate.slice(0, 4))),
  }
}

function detectPreset(startDate: string, endDate: string, baseDate: string): PeriodPreset {
  const presets = periodPresets(baseDate)
  if (startDate === presets.month.start && endDate === presets.month.end) return 'month'
  if (startDate === presets.quarter.start && endDate === presets.quarter.end) return 'quarter'
  if (startDate === presets.year.start && endDate === presets.year.end) return 'year'
  return 'custom'
}

export function BudgetModal({
  open,
  onClose,
  budget,
  defaultCategoryId,
  defaultSubcategoryId,
}: {
  open: boolean
  onClose: () => void
  budget?: Budget
  defaultCategoryId?: string
  defaultSubcategoryId?: string
}) {
  const categories = useStore((state) => state.categories)
  const addBudget = useStore((state) => state.addBudget)
  const updateBudget = useStore((state) => state.updateBudget)
  const currency = useStore((state) => state.settings.currency)
  const referenceDate = useUI((state) => state.referenceDate)
  const toast = useUI((state) => state.toast)

  const expenseCategories = useMemo(
    () => categories.filter((category) => category.type === 'expense'),
    [categories],
  )
  const baseDate = referenceDate || todayISO()
  const presets = periodPresets(baseDate)

  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [startDate, setStartDate] = useState(presets.month.start)
  const [endDate, setEndDate] = useState(presets.month.end)
  const [preset, setPreset] = useState<PeriodPreset>('month')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const initialCategory =
      budget?.categoryId ?? defaultCategoryId ?? expenseCategories[0]?.id ?? ''
    const initialStart = budget?.startDate ?? presets.month.start
    const initialEnd = budget?.endDate ?? presets.month.end
    setCategoryId(initialCategory)
    setSubcategoryId(budget?.subcategoryId ?? defaultSubcategoryId ?? '')
    setAmount(budget ? String(budget.amount) : '')
    setStartDate(initialStart)
    setEndDate(initialEnd)
    setPreset(budget ? detectPreset(initialStart, initialEnd, baseDate) : 'month')
    setError('')
    // Solo reinicializa al abrir el modal o cambiar de presupuesto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, budget?.id, defaultCategoryId, defaultSubcategoryId])

  const selectedCategory = expenseCategories.find(
    (category) => category.id === categoryId,
  )
  const subcategory = selectedCategory?.subcategories.find(
    (sub) => sub.id === subcategoryId,
  )

  const applyPreset = (next: PeriodPreset) => {
    if (next === 'custom') {
      setPreset('custom')
      return
    }
    const range = presets[next]
    setStartDate(range.start)
    setEndDate(range.end)
    setPreset(next)
    setError('')
  }

  const handleCategoryChange = (nextId: string) => {
    setCategoryId(nextId)
    setSubcategoryId('')
    setError('')
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const parsedAmount = Number(amount.replace(',', '.'))
    const payload = {
      categoryId,
      subcategoryId: subcategoryId || undefined,
      amount: parsedAmount,
      startDate,
      endDate,
    }

    const result = budget ? updateBudget(budget.id, payload) : addBudget(payload)
    if (!result.ok) {
      setError(result.error)
      return
    }

    toast(budget ? 'Presupuesto actualizado.' : 'Presupuesto creado.')
    onClose()
  }

  const formId = 'budget-form'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={budget ? 'Editar presupuesto' : 'Nuevo presupuesto'}
      description="Define un límite de gasto por categoría o subcategoría para el periodo que quieras."
      icon={
        <span
          className="grid h-9 w-9 place-items-center rounded-xl"
          style={{
            backgroundColor: selectedCategory ? `${selectedCategory.color}22` : undefined,
            color: selectedCategory?.color,
          }}
        >
          <PiggyBank size={18} />
        </span>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={!categoryId}>
            {budget ? 'Guardar cambios' : 'Crear presupuesto'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        {selectedCategory && (
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface2/60 p-3">
            <CategoryIcon
              icon={subcategory?.icon ?? selectedCategory.icon}
              color={subcategory?.color ?? selectedCategory.color}
              size={42}
              radius={13}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-fg">
                {subcategory?.name ?? selectedCategory.name}
              </p>
              <p className="text-[11px] text-faint">
                {subcategory ? `Dentro de ${selectedCategory.name}` : 'Categoría completa'}
              </p>
            </div>
            <span className="rounded-lg bg-expense-soft px-2 py-1 text-[10px] font-semibold text-expense">
              Gasto
            </span>
          </div>
        )}

        {expenseCategories.length === 0 ? (
          <p className="rounded-xl border border-warn/20 bg-warn-soft px-3 py-2.5 text-[11.5px] leading-relaxed text-warn">
            Necesitas al menos una categoría de gasto para crear un presupuesto.
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label="Categoría"
                value={categoryId}
                onChange={(event) => handleCategoryChange(event.target.value)}
              >
                {expenseCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>

              <Select
                label="Ámbito"
                value={subcategoryId}
                onChange={(event) => {
                  setSubcategoryId(event.target.value)
                  setError('')
                }}
                disabled={!selectedCategory?.subcategories.length}
                hint={
                  selectedCategory?.subcategories.length
                    ? undefined
                    : 'Esta categoría no tiene subcategorías.'
                }
              >
                <option value="">Toda la categoría</option>
                {selectedCategory?.subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </Select>
            </div>

            <Input
              label="Importe límite"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value)
                setError('')
              }}
              placeholder="0,00"
              hint={
                amount && Number(amount.replace(',', '.')) > 0
                  ? `${formatMoney(Number(amount.replace(',', '.')), currency)} para este periodo`
                  : 'El gasto de la categoría no debería superar este importe.'
              }
              autoFocus
            />

            <div>
              <p className="label">Periodo</p>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {[
                  { value: 'month' as const, label: 'Este mes' },
                  { value: 'quarter' as const, label: '3 meses' },
                  { value: 'year' as const, label: 'Este año' },
                  { value: 'custom' as const, label: 'Personalizado' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => applyPreset(option.value)}
                    className={cn(
                      'inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border px-2 text-[11px] font-medium transition',
                      preset === option.value
                        ? 'border-brand/30 bg-brand-soft text-brand'
                        : 'border-line bg-surface text-muted hover:border-line-strong hover:text-fg',
                    )}
                  >
                    {option.value === 'custom' && <CalendarRange size={12} />}
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Desde"
                type="date"
                value={startDate}
                onChange={(event) => {
                  setStartDate(event.target.value)
                  setPreset('custom')
                  setError('')
                }}
                required
              />
              <Input
                label="Hasta"
                type="date"
                value={endDate}
                min={startDate}
                onChange={(event) => {
                  setEndDate(event.target.value)
                  setPreset('custom')
                  setError('')
                }}
                required
              />
            </div>
          </>
        )}

        {error && (
          <p className="rounded-xl border border-expense/20 bg-expense-soft px-3 py-2 text-xs font-medium text-expense">
            {error}
          </p>
        )}
      </form>
    </Modal>
  )
}
