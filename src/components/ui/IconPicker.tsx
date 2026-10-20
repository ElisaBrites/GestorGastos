import { useMemo, useState } from 'react'
import { Check, Search } from 'lucide-react'
import { ICON_LABELS, ICON_NAMES, Glyph } from '../../lib/icons'
import { cn } from '../../lib/utils'

export function IconPicker({
  value,
  onChange,
  icons = ICON_NAMES,
  className,
}: {
  value: string
  onChange: (icon: string) => void
  icons?: string[]
  className?: string
}) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return icons
    return icons.filter(
      (name) =>
        name.toLowerCase().includes(term) ||
        (ICON_LABELS[name] ?? '').toLowerCase().includes(term),
    )
  }, [icons, query])

  return (
    <div className={cn('rounded-xl border border-line bg-surface2/60 p-2.5', className)}>
      <div className="relative mb-2">
        <Search
          size={14}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint"
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar icono…"
          className="h-8 w-full rounded-lg border border-line bg-surface pl-7 pr-2 text-xs text-fg outline-none transition placeholder:text-faint focus:border-brand/50"
        />
      </div>
      <div className="grid max-h-40 grid-cols-8 gap-1 overflow-y-auto pr-1 sm:grid-cols-10">
        {filtered.map((name) => {
          const selected = value === name
          return (
            <button
              key={name}
              type="button"
              title={ICON_LABELS[name] ?? name}
              onClick={() => onChange(name)}
              className={cn(
                'relative grid h-8 w-8 place-items-center rounded-lg border transition',
                selected
                  ? 'border-brand bg-brand-soft text-brand'
                  : 'border-transparent text-muted hover:border-line hover:bg-surface hover:text-fg',
              )}
            >
              <Glyph name={name} size={16} />
              {selected && (
                <span className="absolute -right-1 -top-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-brand text-white">
                  <Check size={9} strokeWidth={3} />
                </span>
              )}
            </button>
          )
        })}
        {filtered.length === 0 && (
          <p className="col-span-full py-4 text-center text-xs text-faint">
            No hay iconos con ese nombre.
          </p>
        )}
      </div>
    </div>
  )
}
