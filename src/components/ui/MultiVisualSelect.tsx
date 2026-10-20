import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Wallet } from 'lucide-react'
import { cn } from '../../lib/utils'
import { CategoryIcon } from './CategoryIcon'
import type { VisualOption } from './VisualSelect'

interface MultiVisualSelectProps {
  label?: string
  ariaLabel?: string
  values: string[]
  onChange: (values: string[]) => void
  options: VisualOption[]
  placeholder?: string
  /** Texto de la opción que representa «sin filtro». */
  allLabel?: string
  disabled?: boolean
  className?: string
  compact?: boolean
  emptyLabel?: string
}

interface MenuPosition {
  top?: number
  bottom?: number
  left: number
  width: number
  maxHeight: number
}

export function MultiVisualSelect({
  label,
  ariaLabel,
  values,
  onChange,
  options,
  placeholder = 'Selecciona…',
  allLabel = 'Todas las opciones',
  disabled = false,
  className,
  compact = false,
  emptyLabel = 'Sin opciones disponibles',
}: MultiVisualSelectProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<MenuPosition | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonId = useId()
  const listId = useId()

  const selectedOptions = options.filter((option) => values.includes(option.value))
  const summary =
    selectedOptions.length === 0
      ? undefined
      : selectedOptions.length === 1
        ? selectedOptions[0]
        : {
            label: `${selectedOptions.length} billeteras`,
            icon: selectedOptions[0].icon,
            color: selectedOptions[0].color,
          }
  const accessibleName = ariaLabel
    ? `${ariaLabel}: ${summary?.label ?? allLabel}`
    : label
      ? `${label}: ${summary?.label ?? allLabel}`
      : undefined

  const openMenu = () => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const width = Math.min(Math.max(rect.width, 250), window.innerWidth - 16)
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8)
    const spaceBelow = window.innerHeight - rect.bottom - 8
    const spaceAbove = rect.top - 8
    const openAbove = spaceBelow < 210 && spaceAbove > spaceBelow
    const maxHeight = Math.max(130, Math.min(330, openAbove ? spaceAbove : spaceBelow))
    setPosition({
      top: openAbove ? undefined : rect.bottom + 6,
      bottom: openAbove ? window.innerHeight - rect.top + 6 : undefined,
      left,
      width,
      maxHeight,
    })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const closeMenu = () => setOpen(false)
    const onScroll = (event: Event) => {
      if (menuRef.current?.contains(event.target as Node)) return
      closeMenu()
    }
    document.addEventListener('mousedown', onPointerDown)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', closeMenu)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', closeMenu)
    }
  }, [open])

  useEffect(() => {
    if (disabled) setOpen(false)
  }, [disabled])

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => {
      const selectedOption = menuRef.current?.querySelector<HTMLButtonElement>(
        '[role="option"][aria-selected="true"]',
      )
      const firstOption = menuRef.current?.querySelector<HTMLButtonElement>(
        '[role="option"]',
      )
      ;(selectedOption ?? firstOption)?.focus()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [open])

  const handleTriggerKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === 'Escape' && open) {
      event.stopPropagation()
      setOpen(false)
      return
    }
    if (
      !disabled &&
      !open &&
      (event.key === 'ArrowDown' || event.key === 'ArrowUp')
    ) {
      event.preventDefault()
      openMenu()
    }
  }

  const handleMenuKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      setOpen(false)
      triggerRef.current?.focus()
      return
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    const optionButtons = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [],
    )
    if (optionButtons.length === 0) return
    event.preventDefault()
    const currentIndex = optionButtons.indexOf(document.activeElement as HTMLButtonElement)
    let nextIndex = 0
    if (event.key === 'End') nextIndex = optionButtons.length - 1
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % optionButtons.length
    else nextIndex = currentIndex <= 0 ? optionButtons.length - 1 : currentIndex - 1
    optionButtons[nextIndex]?.focus()
  }

  const toggle = (value: string) => {
    onChange(
      options
        .filter((option) => values.includes(option.value) !== (option.value === value))
        .map((option) => option.value),
    )
  }

  return (
    <div className={className}>
      {label && (
        <label className="label" htmlFor={buttonId}>
          {label}
        </label>
      )}

      <button
        ref={triggerRef}
        id={buttonId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={accessibleName}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          'field flex items-center gap-2 text-left',
          compact && 'h-9 px-2.5 py-0 text-xs',
          disabled && 'cursor-not-allowed opacity-55',
          open && 'border-brand/50 ring-2 ring-brand/10',
        )}
      >
        {summary ? (
          <CategoryIcon
            icon={summary.icon ?? 'Wallet'}
            color={summary.color ?? '#64748b'}
            size={compact ? 20 : 24}
            radius={compact ? 6 : 8}
          />
        ) : (
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-surface text-faint">
            <Wallet size={12} />
          </span>
        )}
        <span
          className={cn(
            'min-w-0 flex-1 truncate',
            summary ? 'text-fg' : 'text-faint',
          )}
        >
          {summary?.label ?? allLabel}
        </span>
        <ChevronDown
          size={compact ? 14 : 16}
          className={cn('shrink-0 text-faint transition-transform', open && 'rotate-180')}
        />
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-multiselectable="true"
            aria-label={ariaLabel ?? label}
            onKeyDown={handleMenuKeyDown}
            onBlur={(event) => {
              const next = event.relatedTarget as Node | null
              if (
                next &&
                (menuRef.current?.contains(next) || triggerRef.current?.contains(next))
              ) {
                return
              }
              setOpen(false)
            }}
            className="fixed z-[70] animate-pop-in overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-[var(--shadow-pop)]"
            style={{
              top: position.top,
              bottom: position.bottom,
              left: position.left,
              width: position.width,
              maxHeight: position.maxHeight,
            }}
          >
            <button
              type="button"
              role="option"
              aria-selected={values.length === 0}
              onClick={() => onChange([])}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition',
                values.length === 0
                  ? 'bg-brand-soft text-brand'
                  : 'text-fg hover:bg-surface2',
              )}
            >
              <span
                className={cn(
                  'grid h-5 w-5 shrink-0 place-items-center rounded-md border',
                  values.length === 0
                    ? 'border-brand bg-brand text-white'
                    : 'border-line-strong bg-surface',
                )}
              >
                {values.length === 0 && <Check size={11} strokeWidth={3} />}
              </span>
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-surface text-faint">
                <Wallet size={13} />
              </span>
              <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">
                {allLabel}
              </span>
            </button>

            <div className="my-1 border-t border-line" />

            {options.length === 0 ? (
              <p className="px-2 py-3 text-center text-[11.5px] leading-relaxed text-faint">
                {emptyLabel}
              </p>
            ) : (
              options.map((option) => {
                const active = values.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => toggle(option.value)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition',
                      active ? 'bg-brand-soft' : 'hover:bg-surface2',
                    )}
                  >
                    <span
                      className={cn(
                        'grid h-5 w-5 shrink-0 place-items-center rounded-md border',
                        active
                          ? 'border-brand bg-brand text-white'
                          : 'border-line-strong bg-surface',
                      )}
                    >
                      {active && <Check size={11} strokeWidth={3} />}
                    </span>
                    <CategoryIcon
                      icon={option.icon ?? 'Wallet'}
                      color={option.color ?? '#64748b'}
                      size={compact ? 22 : 26}
                      radius={compact ? 7 : 8}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block truncate text-[12.5px] font-medium',
                          active ? 'text-brand' : 'text-fg',
                        )}
                      >
                        {option.label}
                      </span>
                      {option.description && (
                        <span className="block truncate text-[10.5px] text-faint">
                          {option.description}
                        </span>
                      )}
                    </span>
                  </button>
                )
              })
            )}
          </div>,
          document.body,
        )}
    </div>
  )
}
