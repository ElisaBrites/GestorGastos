import { useMemo, useState, type FormEvent } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Pencil,
  Plus,
  Tag,
  Tags,
  Trash2,
  X,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { useUI } from '../store/useUI'
import { currentMonthKey, monthKey } from '../lib/dates'
import { formatMoney } from '../lib/format'
import { hexToRgba } from '../lib/utils'
import type { Category, TxType } from '../types'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Segmented } from '../components/ui/Segmented'
import { CategoryIcon } from '../components/ui/CategoryIcon'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { CategoryModal } from '../components/CategoryModal'

function CategoryCard({
  category,
  monthTotal,
  currency,
  onEdit,
  onDelete,
}: {
  category: Category
  monthTotal: number
  currency: string
  onEdit: () => void
  onDelete: () => void
}) {
  const addSubcategory = useStore((state) => state.addSubcategory)
  const deleteSubcategory = useStore((state) => state.deleteSubcategory)
  const toast = useUI((state) => state.toast)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const result = addSubcategory(category.id, name)
    if (result.ok) {
      setName('')
      toast('Subcategoría añadida.')
    } else {
      toast(result.error, 'error')
    }
  }

  return (
    <div className="card relative overflow-hidden p-4">
      <div
        className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full blur-2xl"
        style={{ backgroundColor: hexToRgba(category.color, 0.18) }}
      />
      <div className="relative flex items-start gap-3">
        <CategoryIcon icon={category.icon} color={category.color} size={42} radius={13} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-fg">{category.name}</p>
          <p className="mt-0.5 truncate text-[11px] text-faint">
            {category.subcategories.length} subcategoría
            {category.subcategories.length === 1 ? '' : 's'}
            {monthTotal > 0 && (
              <>
                {' · '}
                <span
                  className={
                    category.type === 'income' ? 'text-income' : 'text-muted'
                  }
                >
                  {formatMoney(monthTotal, currency)} este mes
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="grid h-7 w-7 place-items-center rounded-lg text-faint transition hover:bg-surface2 hover:text-fg"
            aria-label={`Editar ${category.name}`}
            title="Editar categoría"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="grid h-7 w-7 place-items-center rounded-lg text-faint transition hover:bg-expense-soft hover:text-expense"
            aria-label={`Eliminar ${category.name}`}
            title="Eliminar categoría"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="relative mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
        {category.subcategories.map((sub) => (
          <span
            key={sub.id}
            className="group/chip inline-flex items-center gap-1 rounded-lg border border-line bg-surface2 py-1 pl-2 pr-1 text-[11px] text-muted transition hover:text-fg"
          >
            {sub.name}
            <button
              type="button"
              onClick={() => {
                deleteSubcategory(category.id, sub.id)
                toast('Subcategoría eliminada.')
              }}
              className="grid h-4 w-4 place-items-center rounded text-faint transition hover:bg-expense-soft hover:text-expense"
              aria-label={`Eliminar subcategoría ${sub.name}`}
              title="Eliminar subcategoría"
            >
              <X size={10} />
            </button>
          </span>
        ))}

        {adding ? (
          <form onSubmit={submit} className="flex items-center gap-1">
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nombre…"
              maxLength={30}
              className="h-6 w-28 rounded-md border border-brand/40 bg-surface px-1.5 text-[11px] text-fg outline-none placeholder:text-faint focus:ring-2 focus:ring-brand/15"
            />
            <button
              type="submit"
              className="grid h-6 w-6 place-items-center rounded-md bg-brand text-white transition hover:brightness-110"
              aria-label="Añadir subcategoría"
            >
              <Check size={12} />
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false)
                setName('')
              }}
              className="grid h-6 w-6 place-items-center rounded-md text-faint transition hover:bg-surface2 hover:text-fg"
              aria-label="Cancelar"
            >
              <X size={12} />
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-dashed border-line-strong px-2 py-1 text-[11px] font-medium text-muted transition hover:border-brand/40 hover:text-brand"
          >
            <Plus size={11} />
            Subcategoría
          </button>
        )}
        {category.subcategories.length === 0 && !adding && (
          <span className="text-[10.5px] text-faint">Sin subcategorías todavía</span>
        )}
      </div>
    </div>
  )
}

export function Categories() {
  const categories = useStore((state) => state.categories)
  const transactions = useStore((state) => state.transactions)
  const currency = useStore((state) => state.settings.currency)
  const deleteCategory = useStore((state) => state.deleteCategory)
  const toast = useUI((state) => state.toast)

  const [tab, setTab] = useState<TxType>('expense')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | undefined>()
  const [deleting, setDeleting] = useState<Category | undefined>()

  const month = currentMonthKey()
  const monthByCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const tx of transactions) {
      if (monthKey(tx.date) !== month) continue
      map.set(tx.categoryId, (map.get(tx.categoryId) ?? 0) + tx.amount)
    }
    return map
  }, [transactions, month])

  const visible = categories.filter((category) => category.type === tab)
  const expenseCount = categories.filter((category) => category.type === 'expense').length
  const incomeCount = categories.filter((category) => category.type === 'income').length

  const openCreate = () => {
    setEditing(undefined)
    setModalOpen(true)
  }
  const openEdit = (category: Category) => {
    setEditing(category)
    setModalOpen(true)
  }

  const handleDelete = () => {
    if (!deleting) return
    const result = deleteCategory(deleting.id)
    if (result.ok) toast('Categoría eliminada.')
    else toast(result.error, 'error')
  }

  return (
    <div className="page-wrap space-y-4">
      <PageHeader
        eyebrow="Organización"
        title="Categorías"
        subtitle="Personaliza iconos, colores y subcategorías para entender mejor tus números."
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} strokeWidth={2.4} />
            Nueva categoría
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          value={tab}
          onChange={(next) => setTab(next)}
          options={[
            {
              value: 'expense',
              label: `Gastos · ${expenseCount}`,
              icon: <ArrowUpRight size={13} />,
            },
            {
              value: 'income',
              label: `Ingresos · ${incomeCount}`,
              icon: <ArrowDownLeft size={13} />,
            },
          ]}
        />
        <p className="flex items-center gap-1.5 text-[11.5px] text-faint">
          <Tags size={13} />
          Pulsa «+ Subcategoría» en una tarjeta para añadir detalle.
        </p>
      </div>

      {visible.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              monthTotal={monthByCategory.get(category.id) ?? 0}
              currency={currency}
              onEdit={() => openEdit(category)}
              onDelete={() => setDeleting(category)}
            />
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={<Tag size={20} />}
            title={`Sin categorías de ${tab === 'income' ? 'ingreso' : 'gasto'}`}
            description="Crea una categoría con su icono y color para clasificar tus movimientos."
            action={
              <Button size="sm" onClick={openCreate}>
                <Plus size={14} />
                Nueva categoría
              </Button>
            }
          />
        </div>
      )}

      <div className="rounded-2xl border border-line bg-surface2/50 px-4 py-3 text-[11.5px] leading-relaxed text-muted">
        <span className="font-medium text-fg">Cómo funcionan:</span> cada movimiento se
        asigna a una categoría y, opcionalmente, a una subcategoría. Las estadísticas se
        calculan con ambas, así que cuanto más detalladas estén, mejor será el análisis.
      </div>

      <CategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        category={editing}
        defaultType={tab}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(undefined)}
        onConfirm={handleDelete}
        title="Eliminar categoría"
        description={`Vas a eliminar «${deleting?.name ?? ''}» junto con sus subcategorías. Solo es posible si no tiene movimientos ni fijos asociados.`}
        confirmLabel="Eliminar categoría"
      />
    </div>
  )
}
