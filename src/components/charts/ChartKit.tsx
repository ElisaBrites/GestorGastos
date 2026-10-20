import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export function TooltipCard({
  title,
  rows,
  footer,
}: {
  title: string
  rows: { label: string; value: string; color?: string }[]
  footer?: ReactNode
}) {
  return (
    <div className="min-w-[160px] rounded-xl border border-line bg-elevated px-3 py-2.5 shadow-[var(--shadow-pop)]">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
        {title}
      </p>
      <div className="space-y-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-muted">
              {row.color && (
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: row.color }}
                />
              )}
              {row.label}
            </span>
            <span className="tnum font-semibold text-fg">{row.value}</span>
          </div>
        ))}
      </div>
      {footer && <div className="mt-1.5 border-t border-line pt-1.5">{footer}</div>}
    </div>
  )
}

export function ChartLegend({
  items,
  className,
}: {
  items: { label: string; color: string }[]
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5', className)}>
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 text-[11px] text-muted">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </span>
      ))}
    </div>
  )
}
