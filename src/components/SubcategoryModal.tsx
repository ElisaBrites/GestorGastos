import { useEffect, useState, type FormEvent } from 'react'
import { Tag } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useUI } from '../store/useUI'
import { CATEGORY_COLORS } from '../lib/defaults'
import { ICON_NAMES } from '../lib/icons'
import type { Category, Subcategory } from '../types'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { Input } from './ui/Input'
import { ColorPicker } from './ui/ColorPicker'
import { IconPicker } from './ui/IconPicker'
import { CategoryIcon } from './ui/CategoryIcon'

export function SubcategoryModal({
  open,
  onClose,
  category,
  subcategory,
  onCreated,
  onUpdated,
}: {
  open: boolean
  onClose: () => void
  category?: Category
  subcategory?: Subcategory
  onCreated?: (id: string) => void
  onUpdated?: () => void
}) {
  const addSubcategory = useStore((state) => state.addSubcategory)
  const updateSubcategory = useStore((state) => state.updateSubcategory)
  const toast = useUI((state) => state.toast)

  const [name, setName] = useState('')
  const [icon, setIcon] = useState('Tag')
  const [color, setColor] = useState(CATEGORY_COLORS[0])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setName(subcategory?.name ?? '')
    setIcon(subcategory?.icon ?? category?.icon ?? 'Tag')
    setColor(subcategory?.color ?? category?.color ?? CATEGORY_COLORS[0])
    setError('')
  }, [open, category, subcategory])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!category) {
      setError('Selecciona una categoría antes de crear la subcategoría.')
      return
    }
    const clean = name.trim()
    if (!clean) {
      setError('Escribe un nombre para la subcategoría.')
      return
    }

    const payload = { name: clean, icon, color }

    if (subcategory) {
      const result = updateSubcategory(category.id, subcategory.id, payload)
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast('Subcategoría actualizada.')
      onUpdated?.()
    } else {
      const result = addSubcategory(category.id, payload)
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast(onCreated ? 'Subcategoría añadida y seleccionada.' : 'Subcategoría añadida.')
      if (result.id) onCreated?.(result.id)
    }
    onClose()
  }

  const formId = 'subcategory-form'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={subcategory ? 'Editar subcategoría' : 'Nueva subcategoría'}
      description={
        category
          ? `Dentro de «${category.name}». Puedes darle su propio icono y color.`
          : 'Selecciona una categoría para añadir la subcategoría.'
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
          <Button type="submit" form={formId} disabled={!category}>
            {subcategory ? 'Guardar cambios' : 'Crear subcategoría'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface2/60 p-3">
          <CategoryIcon icon={icon} color={color} size={44} radius={14} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-fg">
              {name.trim() || 'Mi nueva subcategoría'}
            </p>
            <p className="truncate text-[11px] text-faint">
              {category?.name ?? 'Sin categoría'}
            </p>
          </div>
        </div>

        <Input
          label="Nombre"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setError('')
          }}
          placeholder="Ej. Supermercado"
          maxLength={30}
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
