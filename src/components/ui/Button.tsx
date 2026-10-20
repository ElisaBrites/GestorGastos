import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variants: Record<Variant, string> = {
  primary:
    'gradient-brand text-white shadow-[0_8px_20px_-10px_rgba(99,85,242,0.8)] hover:brightness-110 active:brightness-95',
  secondary:
    'border border-line bg-surface text-fg hover:border-line-strong hover:bg-surface2',
  ghost: 'text-muted hover:bg-surface2 hover:text-fg',
  danger: 'bg-expense text-white hover:brightness-95',
  soft: 'bg-brand-soft text-brand hover:brightness-95',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-xs',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-11 gap-2 rounded-xl px-5 text-sm',
  icon: 'h-9 w-9 rounded-xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-medium transition-all duration-150 outline-none focus-visible:ring-4 focus-visible:ring-brand/25 disabled:pointer-events-none disabled:opacity-45',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}
