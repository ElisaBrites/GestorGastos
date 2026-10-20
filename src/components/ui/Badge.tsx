import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

type Tone = 'neutral' | 'brand' | 'income' | 'expense' | 'warn'

const tones: Record<Tone, string> = {
  neutral: 'bg-surface2 text-muted border-line',
  brand: 'bg-brand-soft text-brand border-brand/15',
  income: 'bg-income-soft text-income border-income/20',
  expense: 'bg-expense-soft text-expense border-expense/20',
  warn: 'bg-warn-soft text-warn border-warn/20',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
  dot,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
  dot?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
