import { useEffect, useState, type FormEvent } from 'react'
import { ArrowDownLeft, ArrowUpRight, Tag } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useUI } from '../store/useUI'
import { CATEGORY_COLORS } from '../lib/defaults'
import { ICON_NAMES } from '../lib/icons'
import type { Category, TxType } from '../types'
import { cn } from '../lib/utils'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { Input } from './ui/Input'
import { ColorPicker } from './ui/ColorPicker'
import { IconPicker } from './ui/IconPicker'
import { CategoryIcon } from './ui/CategoryIcon'

export function CategoryModal({
  open,
  onClose,
  category,
  defaultType = 'expense',
  lockType = false,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  category?: Category
  defaultType?: TxType
  /** Fija el tipo actual, útil al crear una categoría desde un movimiento. */
  lockType?: boolean
  onCreated?: (id: string) => void
}) {
  const addCategory = useStore((state) => state.addCategory)
  const updateCategory = useStore((state) => state.updateCategory)
  const toast = useUI((state) => state.toast)

  const [name, setName] = useState('')
  const [type, setType] = useState<TxType>(defaultType)
  const [icon, setIcon] = useState('Tag')
  const [color, setColor] = useState(CATEGORY_COLORS[0])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setType(category?.type ?? defaultType)
    setName(category?.name ?? '')
    setIcon(
      category?.icon ?? ((category?.type ?? defaultType) === 'expense' ? 'ShoppingBag' : 'Briefcase'),
    )
    setColor(
      category?.color ??
        ((category?.type ?? defaultType) === 'expense' ? CATEGORY_COLORS[1] : '#10b981'),
    )
    setError('')
  }, [open, category, defaultType])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const clean = name.trim()
    if (!clean) {
      setError('Escribe un nombre para la categoría.')
      return
    }
    const payload = { name: clean, type, icon, color }
    if (category) {
      updateCategory(category.id, payload)
      toast('Categoría actualizada.')
    } else {
      const id = addCategory(payload)
      toast(
        onCreated
          ? 'Categoría creada y seleccionada.'
          : 'Categoría creada. Añade sus subcategorías.',
      )
      onCreated?.(id)
    }
    onClose()
  }

  const formId = 'category-form'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={category ? 'Editar categoría' : 'Nueva categoría'}
      description={
        category
          ? 'Cambia el nombre, el icono o el color de la categoría.'
          : 'Crea una categoría y luego añade subcategorías para afinar tus estadísticas.'
      }
      icon={
        <span
          className="grid h-9 w-9 place-items-center rounded-xl"
          style={{ backgroundColor: `${color}22`, color }}
        >
          <Tag size={18} />
        </span>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId}>
            {category ? 'Guardar cambios' : 'Crear categoría'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface2/60 p-3">
          <CategoryIcon icon={icon} color={color} size={44} radius={14} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-fg">
              {name.trim() || 'Mi nueva categoría'}
            </p>
            <p className="text-[11px] text-faint">
              {type === 'income' ? 'Ingreso' : 'Gasto'}
              {' · '}
              {category ? `${category.subcategories.length} subcategorías` : 'Sin subcategorías'}
            </p>
          </div>
          <span
            className={cn(
              'rounded-lg px-2 py-1 text-[10px] font-semibold',
              type === 'income'
                ? 'bg-income-soft text-income'
                : 'bg-expense-soft text-expense',
            )}
          >
            {type === 'income' ? 'Ingreso' : 'Gasto'}
          </span>
        </div>

        {!category && !lockType && (
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-surface2 p-1.5">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={cn(
                'flex h-9 items-center justify-center gap-2 rounded-xl text-xs font-semibold transition',
                type === 'expense'
                  ? 'bg-surface text-expense shadow-sm ring-1 ring-expense/20'
                  : 'text-muted hover:text-fg',
              )}
            >
              <ArrowUpRight size={15} />
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={cn(
                'flex h-9 items-center justify-center gap-2 rounded-xl text-xs font-semibold transition',
                type === 'income'
                  ? 'bg-surface text-income shadow-sm ring-1 ring-income/20'
                  : 'text-muted hover:text-fg',
              )}
            >
              <ArrowDownLeft size={15} />
              Ingreso
            </button>
          </div>
        )}

        <Input
          label="Nombre"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setError('')
          }}
          placeholder={type === 'income' ? 'Ej. Alquiler cobrado' : 'Ej. Restaurantes'}
          maxLength={40}
          autoFocus
        />

        <div>
          <p className="label">Icono</p>
          <IconPicker value={icon} onChange={setIcon} icons={ICON_NAMES} />
        </div>

        <div>
          <p className="label">Color</p>
          <ColorPicker value={color} onChange={setColor} colors={CATEGORY_COLORS} />
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
