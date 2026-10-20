import type { Frequency } from '../types'

export const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

export const MONTHS_SHORT = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
]

export const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

export function toISO(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayISO() {
  return toISO(new Date())
}

/** Un movimiento con fecha posterior a hoy todavía está programado. */
export function isFutureDate(iso: string) {
  return iso > todayISO()
}

export function parseDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function formatShortDate(iso: string) {
  const date = parseDate(iso)
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`
}

export function formatFullDate(iso: string) {
  const date = parseDate(iso)
  return `${date.getDate()} de ${MONTHS[date.getMonth()]} de ${date.getFullYear()}`
}

export function formatWeekdayDate(iso: string) {
  const date = parseDate(iso)
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`
}

export function monthKey(iso: string) {
  return iso.slice(0, 7)
}

export function currentMonthKey() {
  return todayISO().slice(0, 7)
}

export function monthLabel(key: string, short = false) {
  const [year, month] = key.split('-').map(Number)
  const name = (short ? MONTHS_SHORT : MONTHS)[(month || 1) - 1] ?? ''
  const label = `${name} ${year}`
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function shiftMonthKey(key: string, delta: number) {
  const [year, month] = key.split('-').map(Number)
  const date = new Date(year, month - 1 + delta, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function monthRange(key: string) {
  const [year, month] = key.split('-').map(Number)
  const last = new Date(year, month, 0).getDate()
  return {
    start: `${key}-01`,
    end: `${key}-${String(last).padStart(2, '0')}`,
  }
}

export function yearRange(year: number) {
  return { start: `${year}-01-01`, end: `${year}-12-31` }
}

export function addDaysISO(iso: string, days: number) {
  const date = parseDate(iso)
  date.setDate(date.getDate() + days)
  return toISO(date)
}

export function addMonthsISO(iso: string, months: number) {
  const date = parseDate(iso)
  const day = date.getDate()
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(day, lastDay))
  return toISO(target)
}

export function advanceByFrequency(iso: string, frequency: Frequency) {
  switch (frequency) {
    case 'weekly':
      return addDaysISO(iso, 7)
    case 'biweekly':
      return addDaysISO(iso, 14)
    case 'monthly':
      return addMonthsISO(iso, 1)
    case 'quarterly':
      return addMonthsISO(iso, 3)
    case 'yearly':
      return addMonthsISO(iso, 12)
    default:
      return iso
  }
}

export function daysFromToday(iso: string) {
  const today = parseDate(todayISO()).getTime()
  const target = parseDate(iso).getTime()
  return Math.round((target - today) / 86_400_000)
}

export function relativeDate(iso: string) {
  const diff = daysFromToday(iso)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Mañana'
  if (diff === -1) return 'Ayer'
  if (diff < 0) {
    if (diff > -7) return `Hace ${Math.abs(diff)} días`
    return formatShortDate(iso)
  }
  if (diff < 7) return `En ${diff} días`
  return formatShortDate(iso)
}

export function relativeGroupLabel(iso: string) {
  const diff = daysFromToday(iso)
  if (diff === 0) return 'Hoy'
  if (diff === -1) return 'Ayer'
  if (diff > 0) return 'Programado'
  const date = parseDate(iso)
  return `${WEEKDAYS[date.getDay()].charAt(0).toUpperCase()}${WEEKDAYS[date.getDay()].slice(1)}, ${date.getDate()} de ${MONTHS[date.getMonth()]}`
}

export function lastNMonthKeys(n: number, endKey = currentMonthKey()) {
  const keys: string[] = []
  for (let i = n - 1; i >= 0; i--) keys.push(shiftMonthKey(endKey, -i))
  return keys
}

export function isWithin(dateISO: string, start: string, end: string) {
  return dateISO >= start && dateISO <= end
}

export function weekdayShort(iso: string) {
  return WEEKDAYS[parseDate(iso).getDay()].slice(0, 3)
}
