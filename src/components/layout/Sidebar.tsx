import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  ArrowLeftRight,
  ChartPie,
  Home,
  LayoutGrid,
  LogOut,
  PiggyBank,
  Plus,
  Repeat,
  Settings,
  Tags,
  Wallet,
  WalletCards,
  X,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useAuth } from '../../store/useAuth'
import { useUI } from '../../store/useUI'
import { todayISO } from '../../lib/dates'
import { logoutWithSync } from '../../lib/session'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'
import { ThemeToggle } from '../ui/ThemeToggle'

const primaryNav = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/movimientos', label: 'Movimientos', icon: ArrowLeftRight },
  { to: '/fijos', label: 'Fijos programados', icon: Repeat },
]

const secondaryNav = [
  { to: '/billeteras', label: 'Billeteras', icon: WalletCards },
  { to: '/categorias', label: 'Categorías', icon: Tags },
  { to: '/presupuestos', label: 'Presupuestos', icon: PiggyBank },
  { to: '/estadisticas', label: 'Estadísticas', icon: ChartPie },
  { to: '/ajustes', label: 'Ajustes', icon: Settings },
]

export function Sidebar({
  onNavigate,
  onClose,
  className,
}: {
  onNavigate?: () => void
  onClose?: () => void
  className?: string
}) {
  const openTransactionModal = useUI((state) => state.openTransactionModal)
  const recurring = useStore((state) => state.recurring)
  const user = useAuth((state) => state.user)
  const offline = useAuth((state) => state.offline)
  const [loggingOut, setLoggingOut] = useState(false)
  const today = todayISO()
  const dueCount = recurring.filter(
    (item) => item.active && !item.autoPost && item.nextDate <= today,
  ).length

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await logoutWithSync()
    } finally {
      setLoggingOut(false)
    }
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'group flex h-10 items-center gap-3 rounded-xl px-3 text-[13.5px] font-medium transition-colors',
      isActive
        ? 'bg-brand-soft text-brand'
        : 'text-muted hover:bg-surface2 hover:text-fg',
    )

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-line bg-surface/80 px-3.5 py-5 backdrop-blur-xl',
        className,
      )}
    >
      <div className="mb-6 flex items-center gap-2.5 px-1.5">
        <span className="gradient-brand grid h-9 w-9 shrink-0 place-items-center rounded-[13px] text-white shadow-[0_8px_18px_-8px_rgba(99,85,242,0.9)]">
          <Wallet size={19} strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-semibold leading-none tracking-[-0.03em]">Bolsillo</p>
          <p className="mt-1 text-[10.5px] font-medium uppercase tracking-[0.12em] text-faint">
            Finanzas personales
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-surface2 hover:text-fg lg:hidden"
            aria-label="Cerrar menú"
          >
            <X size={17} />
          </button>
        )}
      </div>

      <Button
        className="mb-6 w-full justify-start gap-2"
        size="md"
        onClick={() => {
          openTransactionModal()
          onNavigate?.()
        }}
      >
        <Plus size={16} strokeWidth={2.4} />
        Nuevo movimiento
      </Button>

      <nav className="flex-1 space-y-6 overflow-y-auto pb-4">
        <div>
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
            General
          </p>
          <div className="space-y-0.5">
            {primaryNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={linkClass}
              >
                <item.icon size={17} strokeWidth={2} />
                <span className="truncate">{item.label}</span>
                {item.to === '/fijos' && dueCount > 0 && (
                  <span className="ml-auto rounded-full bg-warn-soft px-1.5 py-0.5 text-[10px] font-semibold text-warn">
                    {dueCount}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
            Organización
          </p>
          <div className="space-y-0.5">
            {secondaryNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={linkClass}
              >
                <item.icon size={17} strokeWidth={2} />
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      <div className="mt-2 rounded-2xl border border-line bg-surface2/70 p-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-[13px] font-semibold uppercase text-brand">
            {user?.username?.trim().charAt(0) || '?'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-semibold text-fg">
              {user?.username ?? 'Sesión activa'}
            </p>
            <p
              className={cn(
                'mt-0.5 flex items-center gap-1 text-[10.5px] font-medium',
                offline ? 'text-warn' : 'text-faint',
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  offline ? 'bg-warn' : 'bg-income',
                )}
              />
              {offline ? 'Sin conexión' : 'Sincronizado'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg px-2 text-[11px] font-medium text-muted transition hover:bg-expense-soft hover:text-expense disabled:opacity-50"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut size={12} />
            {loggingOut ? 'Saliendo…' : 'Salir'}
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
          <span className="text-[12px] font-medium text-muted">Apariencia</span>
          <ThemeToggle className="h-8 w-8 border-transparent bg-transparent" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between px-1">
        <span className="flex items-center gap-1.5 text-[10.5px] font-medium text-faint">
          <span className="grid h-4 w-4 place-items-center rounded bg-brand-soft text-brand">
            <LayoutGrid size={9} />
          </span>
          Bolsillo v1.0
        </span>
        <span className="text-[10px] text-faint">ARS · USD · EUR</span>
      </div>
    </aside>
  )
}
