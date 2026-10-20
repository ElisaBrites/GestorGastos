import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

interface FieldProps {
  label?: string
  htmlFor?: string
  hint?: string
  error?: string
  className?: string
  children: ReactNode
}

export function Field({ label, htmlFor, hint, error, className, children }: FieldProps) {
  return (
    <div className={className}>
      {label && (
        <label className="label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-expense">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-faint">{hint}</p>
      ) : null}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

export function Input({ label, hint, error, className, id, ...props }: InputProps) {
  const generated = useId()
  const inputId = id ?? generated
  return (
    <Field label={label} htmlFor={inputId} hint={hint} error={error}>
      <input
        id={inputId}
        className={cn('field', error && 'border-expense/60 focus:border-expense', className)}
        {...props}
      />
    </Field>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
}

export function Select({ label, hint, error, className, id, children, ...props }: SelectProps) {
  const generated = useId()
  const selectId = id ?? generated
  return (
    <Field label={label} htmlFor={selectId} hint={hint} error={error}>
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            'field appearance-none pr-9',
            error && 'border-expense/60 focus:border-expense',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint"
        />
      </div>
    </Field>
  )
}
