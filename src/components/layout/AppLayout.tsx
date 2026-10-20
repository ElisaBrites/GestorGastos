import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  ArrowLeftRight,
  ChartPie,
  Home,
  LayoutGrid,
  Menu,
  Plus,
  Repeat,
  Wallet,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useUI } from '../../store/useUI'
import { todayISO } from '../../lib/dates'
import { useThemeSync } from '../../lib/useTheme'
import { cn } from '../../lib/utils'
import { Sidebar } from './Sidebar'
import { ThemeToggle } from '../ui/ThemeToggle'
import { Toaster } from '../ui/Toaster'
import { TransactionModal } from '../TransactionModal'

const mobileNav = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/movimientos', label: 'Movs.', icon: ArrowLeftRight },
  { to: '/fijos', label: 'Fijos', icon: Repeat },
  { to: '/estadisticas', label: 'Stats', icon: ChartPie },
]

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const openTransactionModal = useUI((state) => state.openTransactionModal)
  const recurring = useStore((state) => state.recurring)
  const today = todayISO()
  const dueCount = recurring.filter(
    (item) => item.active && !item.autoPost && item.nextDate <= today,
  ).length

  useThemeSync()

  useEffect(() => {
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [menuOpen])

  useEffect(() => {
    const run = () => {
      const created = useStore.getState().processRecurring()
      if (created > 0) {
        useUI.getState().toast(
          `Se registraron ${created} movimiento${created === 1 ? '' : 's'} fijo${created === 1 ? '' : 's'} pendiente${created === 1 ? '' : 's'}.`,
          'info',
        )
      }
    }
    run()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') run()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', run)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', run)
    }
  }, [])

  const menuActive =
    !mobileNav.some((item) =>
      item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to),
    )

  return (
    <div className="min-h-dvh">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-[252px] lg:block">
        <Sidebar />
      </div>

      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-bg/85 px-3 backdrop-blur-xl lg:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="icon-btn h-9 w-9 border-transparent bg-transparent"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <span className="gradient-brand grid h-7 w-7 place-items-center rounded-[9px] text-white">
              <Wallet size={15} strokeWidth={2.3} />
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.03em]">Bolsillo</span>
          </Link>
          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle className="h-9 w-9 border-transparent bg-transparent" />
            <button
              type="button"
              onClick={() => openTransactionModal()}
              className="gradient-brand grid h-9 w-9 place-items-center rounded-xl text-white shadow-[0_8px_18px_-10px_rgba(99,85,242,0.9)]"
              aria-label="Nuevo movimiento"
            >
              <Plus size={19} strokeWidth={2.4} />
            </button>
          </div>
        </header>

        <main className="grid-fade min-h-dvh">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/92 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 px-1.5 pb-[env(safe-area-inset-bottom)]">
          {mobileNav.map((item) => {
            const active =
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
                  active ? 'text-brand' : 'text-faint hover:text-muted',
                )}
              >
                <span className="relative">
                  <item.icon size={20} strokeWidth={active ? 2.3 : 1.9} />
                  {item.to === '/fijos' && dueCount > 0 && (
                    <span className="absolute -right-1.5 -top-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-warn px-0.5 text-[8px] font-bold text-white">
                      {dueCount}
                    </span>
                  )}
                </span>
                {item.label}
                {active && (
                  <span className="absolute top-0 h-0.5 w-6 rounded-full bg-brand" />
                )}
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
              menuActive ? 'text-brand' : 'text-faint hover:text-muted',
            )}
          >
            <span className="relative">
              <LayoutGrid size={20} strokeWidth={menuActive ? 2.3 : 1.9} />
            </span>
            Más
            {menuActive && (
              <span className="absolute top-0 h-0.5 w-6 rounded-full bg-brand" />
            )}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-slate-950/50 backdrop-blur-[3px]"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-[310px] animate-drawer-in shadow-2xl">
            <Sidebar
              className="w-full bg-surface"
              onNavigate={() => setMenuOpen(false)}
              onClose={() => setMenuOpen(false)}
            />
          </div>
        </div>
      )}

      <TransactionModal />
      <Toaster />
    </div>
  )
}
