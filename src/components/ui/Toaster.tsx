import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useUI, type ToastTone } from '../../store/useUI'
import { cn } from '../../lib/utils'

const toneStyles: Record<ToastTone, { icon: typeof CheckCircle2; className: string }> = {
  success: { icon: CheckCircle2, className: 'text-income' },
  error: { icon: AlertCircle, className: 'text-expense' },
  info: { icon: Info, className: 'text-brand' },
}

export function Toaster() {
  const toasts = useUI((state) => state.toasts)
  const dismissToast = useUI((state) => state.dismissToast)

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-20 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end">
      {toasts.map((toast) => {
        const { icon: Icon, className } = toneStyles[toast.tone]
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-2xl border border-line bg-elevated px-4 py-3 shadow-[var(--shadow-pop)]"
          >
            <Icon size={18} className={cn('mt-0.5 shrink-0', className)} />
            <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-fg">{toast.message}</p>
            <button
              type="button"
              className="-mr-1 grid h-6 w-6 shrink-0 place-items-center rounded-md text-faint transition hover:bg-surface2 hover:text-fg"
              onClick={() => dismissToast(toast.id)}
              aria-label="Cerrar notificación"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
