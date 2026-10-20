import { CalendarDays, RotateCcw } from 'lucide-react'
import { useUI } from '../../store/useUI'
import { formatFullDate, todayISO } from '../../lib/dates'
import { cn } from '../../lib/utils'

export function ReferenceDateBar() {
  const referenceDate = useUI((state) => state.referenceDate)
  const setReferenceDate = useUI((state) => state.setReferenceDate)
  const resetReferenceDate = useUI((state) => state.resetReferenceDate)
  const today = todayISO()
  const isToday = referenceDate === today
  const isPast = referenceDate < today

  return (
    <div className="sticky top-[calc(3.5rem_+_env(safe-area-inset-top))] z-20 border-b border-line bg-bg/85 backdrop-blur-xl lg:top-0 lg:pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex w-full max-w-[1240px] items-center gap-2 px-3 py-2 sm:px-6 lg:px-8">
        <span
          className={cn(
            'grid h-8 w-8 shrink-0 place-items-center rounded-xl',
            isToday ? 'bg-brand-soft text-brand' : 'bg-warn-soft text-warn',
          )}
          title="Fecha de referencia global"
        >
          <CalendarDays size={15} />
        </span>

        <div className="min-w-0">
          <p className="hidden text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint sm:block">
            Fecha de referencia
          </p>
          <p className="truncate text-[11.5px] font-medium text-fg sm:text-[12px]">
            {isToday ? 'Vista actual' : isPast ? 'Vista histórica' : 'Vista proyectada'}
          </p>
        </div>

        <div className="ml-auto flex min-w-0 items-center gap-1.5">
          <input
            type="date"
            value={referenceDate}
            onChange={(event) => setReferenceDate(event.target.value)}
            aria-label={`Fecha de referencia: ${formatFullDate(referenceDate)}`}
            title="Elige la fecha con la que quieres consultar tus finanzas"
            className="field h-10 w-[132px] px-2 text-[11.5px] sm:w-[148px] sm:text-[12px]"
          />
          <button
            type="button"
            onClick={resetReferenceDate}
            disabled={isToday}
            className={cn(
              'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-[11.5px] font-medium transition',
              isToday
                ? 'cursor-default bg-surface2 text-faint'
                : 'border border-brand/25 bg-brand-soft text-brand hover:bg-brand/15',
            )}
            title="Volver a la fecha actual"
          >
            <RotateCcw size={12} />
            Hoy
          </button>
        </div>
      </div>
    </div>
  )
}
