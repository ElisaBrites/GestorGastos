import { Check, Pipette } from 'lucide-react'
import { CATEGORY_COLORS } from '../../lib/defaults'
import { cn } from '../../lib/utils'

export function ColorPicker({
  value,
  onChange,
  colors = CATEGORY_COLORS,
  className,
}: {
  value: string
  onChange: (color: string) => void
  colors?: string[]
  className?: string
}) {
  const isCustom = !colors.includes(value)
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {colors.map((color) => {
        const selected = value.toLowerCase() === color.toLowerCase()
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={cn(
              'relative grid h-7 w-7 place-items-center rounded-full transition',
              selected
                ? 'ring-2 ring-fg/60 ring-offset-2 ring-offset-surface'
                : 'hover:scale-110',
            )}
            style={{ backgroundColor: color }}
            aria-label={`Color ${color}`}
            title={color}
          >
            {selected && <Check size={13} className="text-white" strokeWidth={3} />}
          </button>
        )
      })}
      <label
        className={cn(
          'relative grid h-7 w-7 cursor-pointer place-items-center overflow-hidden rounded-full border border-line transition hover:scale-110',
          isCustom && 'ring-2 ring-fg/60 ring-offset-2 ring-offset-surface',
        )}
        style={{
          background: isCustom
            ? value
            : 'conic-gradient(#ef4444, #f59e0b, #84cc16, #10b981, #06b6d4, #6366f1, #d946ef, #ef4444)',
        }}
        title="Color personalizado"
      >
        {isCustom ? (
          <Check size={13} className="text-white" strokeWidth={3} />
        ) : (
          <span className="grid h-4 w-4 place-items-center rounded-full bg-surface/85 text-fg">
            <Pipette size={9} />
          </span>
        )}
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Elegir color personalizado"
        />
      </label>
    </div>
  )
}
