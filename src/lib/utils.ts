import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function uid() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  const num = Number.parseInt(full, 16)
  if (Number.isNaN(num)) return `rgba(99, 85, 242, ${alpha})`
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function shadeColor(hex: string, amount: number) {
  const clean = hex.replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  const num = Number.parseInt(full, 16)
  if (Number.isNaN(num)) return hex
  let r = (num >> 16) & 255
  let g = (num >> 8) & 255
  let b = num & 255
  r = clamp(Math.round(r + amount * 255), 0, 255)
  g = clamp(Math.round(g + amount * 255), 0, 255)
  b = clamp(Math.round(b + amount * 255), 0, 255)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
