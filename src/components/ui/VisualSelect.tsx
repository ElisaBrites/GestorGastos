import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Tag } from 'lucide-react'
import { cn } from '../../lib/utils'
import { CategoryIcon } from './CategoryIcon'

export interface VisualOption {
  value: string
  label: string
  icon?: string
  color?: string
  description?: string
}

interface VisualSelectProps {
  label?: string
  ariaLabel?: string
  value: string
  onChange: (value: string) => void
  options: VisualOption[]
  placeholder?: string
  hint?: string
  error?: string
  disabled?: boolean
  className?: string
  compact?: boolean
  action?: ReactNode
  emptyLabel?: string
}

interface MenuPosition {
  top?: number
  bottom?: number
  left: number
  width: number
  maxHeight: number
}

export function VisualSelect({
  label,
  ariaLabel,
  value,
  onChange,
  options,
  placeholder = 'Selecciona…',
  hint,
  error,
  disabled = false,
  className,
  compact = false,
  action,
  emptyLabel = 'Sin opciones disponibles',
}: VisualSelectProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<MenuPosition | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonId = useId()
  const listId = useId()
  const selected = options.find((option) => option.value === value)
  const accessibleName = ariaLabel
    ? `${ariaLabel}: ${selected?.label ?? placeholder}`
    : label
      ? `${label}: ${selected?.label ?? placeholder}`
      : undefined

  const openMenu = () => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const width = Math.min(Math.max(rect.width, 220), window.innerWidth - 16)
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8)
    const spaceBelow = window.innerHeight - rect.bottom - 8
    const spaceAbove = rect.top - 8
    const openAbove = spaceBelow < 190 && spaceAbove > spaceBelow
    const maxHeight = Math.max(
      120,
      Math.min(300, openAbove ? spaceAbove : spaceBelow),
    )
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
    const options = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [],
    )
    if (options.length === 0) return
    event.preventDefault()
    const currentIndex = options.indexOf(document.activeElement as HTMLButtonElement)
    let nextIndex = 0
    if (event.key === 'End') nextIndex = options.length - 1
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % options.length
    else nextIndex = currentIndex <= 0 ? options.length - 1 : currentIndex - 1
    options[nextIndex]?.focus()
  }

  const optionIcon = (option: VisualOption) => (
    <CategoryIcon
      icon={option.icon ?? 'Tag'}
      color={option.color ?? '#94a3b8'}
      size={compact ? 20 : 24}
      radius={compact ? 6 : 8}
    />
  )

  return (
    <div className={className}>
      {(label || action) && (
        <div className="mb-1.5 flex items-center justify-between gap-2">
          {label && (
            <label className="label mb-0" htmlFor={buttonId}>
              {label}
            </label>
          )}
          {action}
        </div>
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
          error && 'border-expense/60',
          open && 'border-brand/50 ring-2 ring-brand/10',
        )}
      >
        {selected ? (
          optionIcon(selected)
        ) : (
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-surface text-faint">
            <Tag size={12} />
          </span>
        )}
        <span
          className={cn(
            'min-w-0 flex-1 truncate',
            selected ? 'text-fg' : 'text-faint',
          )}
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={compact ? 14 : 16}
          className={cn(
            'shrink-0 text-faint transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {error ? (
        <p className="mt-1.5 text-xs font-medium text-expense">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-faint">{hint}</p>
      ) : null}

      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-labelledby={label ? buttonId : undefined}
            aria-label={ariaLabel}
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
            {options.length === 0 ? (
              <p className="px-2 py-3 text-center text-[11.5px] leading-relaxed text-faint">
                {emptyLabel}
              </p>
            ) : (
              options.map((option) => {
                const active = option.value === value
                return (
                  <button
                    key={option.value || '__empty'}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(option.value)
                      setOpen(false)
                      triggerRef.current?.focus()
                    }}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition',
                      active
                        ? 'bg-brand-soft text-brand'
                        : 'text-fg hover:bg-surface2',
                    )}
                  >
                    {optionIcon(option)}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium">
                        {option.label}
                      </span>
                      {option.description && (
                        <span className="block truncate text-[10.5px] text-faint">
                          {option.description}
                        </span>
                      )}
                    </span>
                    {active && <Check size={14} className="shrink-0 text-brand" />}
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
