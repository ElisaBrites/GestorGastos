import { ArrowLeftRight } from 'lucide-react'
import type { Transfer, Wallet } from '../types'
import { formatMoney } from '../lib/format'
import { formatShortDate, isFutureDate } from '../lib/dates'
import { cn } from '../lib/utils'
import { Badge } from './ui/Badge'

export function TransferRow({
  transfer,
  fromWallet,
  toWallet,
  currency,
  onClick,
  compact = false,
}: {
  transfer: Transfer
  fromWallet?: Wallet
  toWallet?: Wallet
  currency: string
  onClick?: () => void
  compact?: boolean
}) {
  const scheduled = isFutureDate(transfer.date)

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
      <span
        className={cn(
          'grid shrink-0 place-items-center rounded-xl bg-brand-soft text-brand',
          compact ? 'h-9 w-9' : 'h-10 w-10',
        )}
      >
        <ArrowLeftRight size={compact ? 16 : 18} strokeWidth={2.1} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-[13.5px] font-medium text-fg">
          <span className="truncate">Transferencia</span>
          {scheduled && (
            <Badge tone="warn" className="shrink-0 px-1.5 py-0 text-[9px]">
              Programada
            </Badge>
          )}
        </p>
        <p className="truncate text-[11.5px] text-faint">
          {fromWallet?.name ?? 'Billetera'} → {toWallet?.name ?? 'Billetera'}
          {transfer.note ? ` · ${transfer.note}` : ''}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="tnum text-[13.5px] font-semibold text-fg">
          {formatMoney(transfer.amount, currency)}
        </p>
        <p className="mt-0.5 text-[11px] text-faint">{formatShortDate(transfer.date)}</p>
      </div>
    </button>
  )
}
