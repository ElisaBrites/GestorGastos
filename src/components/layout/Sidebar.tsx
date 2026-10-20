import { NavLink } from 'react-router-dom'
import {
  ArrowLeftRight,
  ChartPie,
  Download,
  Home,
  LayoutGrid,
  Plus,
  Repeat,
  Settings,
  ShieldCheck,
  Tags,
  Wallet,
  WalletCards,
  X,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useUI } from '../../store/useUI'
import { todayISO } from '../../lib/dates'
import { useInstallPrompt } from '../../lib/useInstallPrompt'
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
  const toast = useUI((state) => state.toast)
  const recurring = useStore((state) => state.recurring)
  const { canInstall, isInstalled, install } = useInstallPrompt()
  const today = todayISO()
  const dueCount = recurring.filter(
    (item) => item.active && !item.autoPost && item.nextDate <= today,
  ).length

  const handleInstall = async () => {
    const outcome = await install()
    if (outcome === 'accepted') toast('Bolsillo se instaló correctamente.')
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
        <div className="flex items-center gap-2 text-[12px] font-medium text-fg">
          <ShieldCheck size={14} className="text-income" />
          Datos locales
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-faint">
          Se guardan en este navegador. Exporta una copia desde Ajustes.
        </p>
        {canInstall && !isInstalled && (
          <button
            type="button"
            onClick={handleInstall}
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg border border-brand/25 bg-brand-soft px-2.5 py-2 text-[11.5px] font-medium text-brand transition hover:bg-brand/15"
          >
            <Download size={13} />
            Instalar app
          </button>
        )}
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
        <span className="text-[10px] text-faint">€ · $ · S/</span>
      </div>
    </aside>
  )
}
