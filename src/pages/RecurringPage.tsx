import { useMemo, useState } from 'react'
import {
  CalendarClock,
  Check,
  Pause,
  Pencil,
  Play,
  Plus,
  Repeat,
  Trash2,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { useUI } from '../store/useUI'
import { FREQUENCY_LABELS } from '../lib/defaults'
import { formatMoney } from '../lib/format'
import { relativeDate, todayISO } from '../lib/dates'
import { cn } from '../lib/utils'
import type { Frequency, Recurring } from '../types'
import { PageHeader, SectionHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { CategoryIcon } from '../components/ui/CategoryIcon'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { RecurringModal } from '../components/RecurringModal'

const MONTHLY_FACTOR: Record<Frequency, number> = {
  weekly: 52 / 12,
  biweekly: 26 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  yearly: 1 / 12,
}

export function RecurringPage() {
  const recurring = useStore((state) => state.recurring)
  const categories = useStore((state) => state.categories)
  const wallets = useStore((state) => state.wallets)
  const currency = useStore((state) => state.settings.currency)
  const toggleRecurring = useStore((state) => state.toggleRecurring)
  const deleteRecurring = useStore((state) => state.deleteRecurring)
  const postRecurringNow = useStore((state) => state.postRecurringNow)
  const toast = useUI((state) => state.toast)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Recurring | undefined>()
  const [deleting, setDeleting] = useState<Recurring | undefined>()

  const today = todayISO()
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  )
  const walletMap = useMemo(
    () => new Map(wallets.map((wallet) => [wallet.id, wallet])),
    [wallets],
  )

  const activeItems = useMemo(
    () =>
      recurring
        .filter((item) => item.active)
        .sort((a, b) => (a.nextDate < b.nextDate ? -1 : 1)),
    [recurring],
  )
  const pausedItems = useMemo(
    () =>
      recurring
        .filter((item) => !item.active)
        .sort((a, b) => (a.nextDate < b.nextDate ? -1 : 1)),
    [recurring],
  )

  const monthlyIncome = useMemo(
    () =>
      activeItems
        .filter((item) => item.type === 'income')
        .reduce((sum, item) => sum + item.amount * MONTHLY_FACTOR[item.frequency], 0),
    [activeItems],
  )
  const monthlyExpense = useMemo(
    () =>
      activeItems
        .filter((item) => item.type === 'expense')
        .reduce((sum, item) => sum + item.amount * MONTHLY_FACTOR[item.frequency], 0),
    [activeItems],
  )

  const dueManual = useMemo(
    () =>
      activeItems.filter((item) => !item.autoPost && item.nextDate <= today),
    [activeItems, today],
  )

  const nextItem = activeItems[0]

  const openCreate = () => {
    setEditing(undefined)
    setModalOpen(true)
  }
  const openEdit = (item: Recurring) => {
    setEditing(item)
    setModalOpen(true)
  }

  const handleRegister = (item: Recurring) => {
    const result = postRecurringNow(item.id)
    if (result.ok) toast('Movimiento fijo registrado.')
    else toast(result.error, 'error')
  }

  const registerAll = () => {
    let count = 0
    for (const item of dueManual) {
      const result = postRecurringNow(item.id)
      if (result.ok) count++
    }
    if (count > 0) {
      toast(`${count} movimiento${count === 1 ? '' : 's'} fijo${count === 1 ? '' : 's'} registrado${count === 1 ? '' : 's'}.`)
    }
  }

  const renderItem = (item: Recurring) => {
    const category = categoryMap.get(item.categoryId)
    const wallet = walletMap.get(item.walletId)
    const sub = category?.subcategories.find((entry) => entry.id === item.subcategoryId)
    const due = item.active && item.nextDate <= today
    const overdue = item.nextDate < today

    return (
      <div key={item.id} className="flex items-start gap-3 p-4">
        <CategoryIcon
          icon={category?.icon ?? 'Repeat'}
          color={category?.color ?? '#64748b'}
          size={42}
          radius={13}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-semibold text-fg">
                {item.note || category?.name || 'Movimiento fijo'}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-faint">
                {category?.name ?? 'Sin categoría'}
                {sub ? ` · ${sub.name}` : ''} · {wallet?.name ?? 'Sin billetera'}
              </p>
            </div>
            <p
              className={cn(
                'tnum shrink-0 text-[14px] font-semibold',
                item.type === 'income' ? 'text-income' : 'text-fg',
              )}
            >
              {item.type === 'income' ? '+' : '−'}
              {formatMoney(item.amount, currency)}
            </p>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <Badge tone={item.active ? 'income' : 'neutral'} dot>
              {item.active ? 'Activo' : 'Pausado'}
            </Badge>
            <Badge tone="brand">{FREQUENCY_LABELS[item.frequency]}</Badge>
            <Badge tone={item.autoPost ? 'neutral' : 'warn'}>
              {item.autoPost ? 'Automático' : 'Manual'}
            </Badge>
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[10.5px]',
                overdue && item.active ? 'font-medium text-warn' : 'text-faint',
              )}
            >
              <CalendarClock size={11} />
              {due ? (overdue ? 'Vencido' : 'Vence hoy') : relativeDate(item.nextDate)}
            </span>

            <div className="ml-auto flex items-center gap-1">
              {due && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 gap-1 px-2 text-[10.5px]"
                  onClick={() => handleRegister(item)}
                >
                  <Check size={12} />
                  Registrar
                </Button>
              )}
              <button
                type="button"
                onClick={() => {
                  toggleRecurring(item.id)
                  toast(item.active ? 'Movimiento fijo pausado.' : 'Movimiento fijo reactivado.')
                }}
                className="grid h-7 w-7 place-items-center rounded-lg text-faint transition hover:bg-surface2 hover:text-fg"
                aria-label={item.active ? 'Pausar fijo' : 'Activar fijo'}
                title={item.active ? 'Pausar' : 'Reactivar'}
              >
                {item.active ? <Pause size={13} /> : <Play size={13} />}
              </button>
              <button
                type="button"
                onClick={() => openEdit(item)}
                className="grid h-7 w-7 place-items-center rounded-lg text-faint transition hover:bg-surface2 hover:text-fg"
                aria-label="Editar fijo"
                title="Editar"
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                onClick={() => setDeleting(item)}
                className="grid h-7 w-7 place-items-center rounded-lg text-faint transition hover:bg-expense-soft hover:text-expense"
                aria-label="Eliminar fijo"
                title="Eliminar"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrap space-y-4">
      <PageHeader
        eyebrow="Planificación"
        title="Fijos programados"
        subtitle={
          nextItem
            ? `${activeItems.length} fijo${activeItems.length === 1 ? '' : 's'} activo${activeItems.length === 1 ? '' : 's'} · próximo ${relativeDate(nextItem.nextDate).toLowerCase()}`
            : 'Programa ingresos y gastos que se repiten cada semana, mes o año.'
        }
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} strokeWidth={2.4} />
            Nuevo fijo
          </Button>
        }
      />

      {dueManual.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-warn/25 bg-warn-soft px-4 py-3.5 sm:flex-row sm:items-center">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-warn/15 text-warn">
            <CalendarClock size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-fg">
              {dueManual.length} fijo{dueManual.length === 1 ? '' : 's'} pendiente
              {dueManual.length === 1 ? '' : 's'} de registrar
            </p>
            <p className="mt-0.5 text-[11.5px] text-muted">
              Están configurados en modo manual y su fecha ya ha llegado.
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={registerAll}>
            <Check size={14} />
            Registrar todos
          </Button>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="p-5">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-faint">
              Ingresos fijos / mes
            </p>
            <p className="mt-1 truncate text-[20px] font-semibold text-income tnum">
              +{formatMoney(monthlyIncome, currency)}
            </p>
          </div>
          <div className="p-5">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-faint">
              Gastos fijos / mes
            </p>
            <p className="mt-1 truncate text-[20px] font-semibold text-expense tnum">
              −{formatMoney(monthlyExpense, currency)}
            </p>
          </div>
          <div className="p-5">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-faint">
              Balance fijo / mes
            </p>
            <p
              className={cn(
                'mt-1 truncate text-[20px] font-semibold tnum',
                monthlyIncome - monthlyExpense >= 0 ? 'text-fg' : 'text-expense',
              )}
            >
              {formatMoney(monthlyIncome - monthlyExpense, currency)}
            </p>
          </div>
        </div>
        <p className="border-t border-line bg-surface2/50 px-5 py-2 text-[10.5px] text-faint">
          Estimación mensual: los importes se normalizan según la frecuencia de cada fijo.
        </p>
      </div>

      {recurring.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Repeat size={20} />}
            title="Sin movimientos fijos"
            description="Añade la nómina, el alquiler, las suscripciones y cualquier pago recurrente para no olvidarlos."
            action={
              <Button size="sm" onClick={openCreate}>
                <Plus size={14} />
                Programar el primero
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <SectionHeader
              className="mb-2 px-1"
              title={`Activos · ${activeItems.length}`}
              subtitle="Se registrarán solos o quedarán pendientes según su modo."
            />
            <div className="card divide-y divide-line overflow-hidden">
              {activeItems.length > 0 ? (
                activeItems.map(renderItem)
              ) : (
                <p className="px-4 py-8 text-center text-[12px] text-faint">
                  No tienes fijos activos. Reactiva uno pausado o crea uno nuevo.
                </p>
              )}
            </div>
          </div>

          {pausedItems.length > 0 && (
            <div>
              <SectionHeader
                className="mb-2 px-1"
                title={`Pausados · ${pausedItems.length}`}
                subtitle="Dejan de generar registros hasta que los reactives."
              />
              <div className="card divide-y divide-line overflow-hidden opacity-80">
                {pausedItems.map(renderItem)}
              </div>
            </div>
          )}
        </div>
      )}

      <RecurringModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        item={editing}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(undefined)}
        onConfirm={() => {
          if (!deleting) return
          deleteRecurring(deleting.id)
          toast('Movimiento fijo eliminado.')
        }}
        title="Eliminar movimiento fijo"
        description="El programa se eliminará, pero los movimientos que ya se hayan registrado se conservarán."
        confirmLabel="Eliminar fijo"
      />
    </div>
  )
}
