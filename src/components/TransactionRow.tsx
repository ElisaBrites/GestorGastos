import { Repeat } from 'lucide-react'
import type { Category, Transaction, Wallet } from '../types'
import { formatMoney } from '../lib/format'
import { formatShortDate, isFutureDate } from '../lib/dates'
import { subcategoryVisual } from '../lib/visuals'
import { cn } from '../lib/utils'
import { Badge } from './ui/Badge'
import { CategoryIcon } from './ui/CategoryIcon'

export function TransactionRow({
  transaction,
  category,
  wallet,
  currency,
  onClick,
  compact = false,
}: {
  transaction: Transaction
  category?: Category
  wallet?: Wallet
  currency: string
  onClick?: () => void
  compact?: boolean
}) {
  const sub = category?.subcategories.find((item) => item.id === transaction.subcategoryId)
  const visual = subcategoryVisual(sub, category)
  const title = sub?.name ?? category?.name ?? 'Sin categoría'
  const meta = [category?.name, wallet?.name].filter(Boolean).join(' · ')
  const scheduled = isFutureDate(transaction.date)

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-3 rounded-xl text-left transition-colors',
        compact ? 'px-1.5 py-2.5' : 'px-2 py-3',
        onClick ? 'hover:bg-surface2' : 'cursor-default',
      )}
    >
      <CategoryIcon
        icon={visual.icon}
        color={visual.color}
        size={compact ? 36 : 40}
      />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-[13.5px] font-medium text-fg">
          <span className="truncate">{title}</span>
          {transaction.recurringId && (
            <Repeat size={11} className="shrink-0 text-faint" aria-label="Movimiento fijo" />
          )}
          {scheduled && (
            <Badge tone="warn" className="shrink-0 px-1.5 py-0 text-[9px]">
              Programado
            </Badge>
          )}
        </p>
        <p className="truncate text-[11.5px] text-faint">
          {meta}
          {transaction.note ? ` · ${transaction.note}` : ''}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p
          className={cn(
            'tnum text-[13.5px] font-semibold',
            transaction.type === 'income' ? 'text-income' : 'text-fg',
          )}
        >
          {transaction.type === 'income' ? '+' : '−'}
          {formatMoney(transaction.amount, currency)}
        </p>
        <p className="mt-0.5 text-[11px] text-faint">{formatShortDate(transaction.date)}</p>
      </div>
    </button>
  )
}
