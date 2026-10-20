const ZERO_DECIMAL = new Set([
  'CLP',
  'COP',
  'PYG',
  'JPY',
  'KRW',
  'VND',
  'ISK',
  'HUF',
  'TWD',
])

export const CURRENCIES = [
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'USD', label: 'Dólar estadounidense', symbol: '$' },
  { code: 'MXN', label: 'Peso mexicano', symbol: '$' },
  { code: 'COP', label: 'Peso colombiano', symbol: '$' },
  { code: 'ARS', label: 'Peso argentino', symbol: '$' },
  { code: 'CLP', label: 'Peso chileno', symbol: '$' },
  { code: 'PEN', label: 'Sol peruano', symbol: 'S/' },
  { code: 'UYU', label: 'Peso uruguayo', symbol: '$U' },
  { code: 'BRL', label: 'Real brasileño', symbol: 'R$' },
  { code: 'GBP', label: 'Libra esterlina', symbol: '£' },
  { code: 'CHF', label: 'Franco suizo', symbol: 'CHF' },
  { code: 'CAD', label: 'Dólar canadiense', symbol: '$' },
  { code: 'AUD', label: 'Dólar australiano', symbol: '$' },
  { code: 'JPY', label: 'Yen japonés', symbol: '¥' },
]

export function currencySymbol(currency: string) {
  return CURRENCIES.find((c) => c.code === currency)?.symbol ?? currency
}

export function formatMoney(amount: number, currency: string) {
  const fractionDigits = ZERO_DECIMAL.has(currency) ? 0 : 2
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount)
  } catch {
    return `${amount.toFixed(fractionDigits)} ${currency}`
  }
}

export function formatSigned(amount: number, currency: string) {
  const sign = amount > 0 ? '+' : amount < 0 ? '−' : ''
  return `${sign}${formatMoney(Math.abs(amount), currency)}`
}

export function formatCompact(amount: number) {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  if (abs >= 1_000_000) {
    return `${sign}${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(abs / 1_000_000)} M`
  }
  if (abs >= 1_000) {
    return `${sign}${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(abs / 1_000)} k`
  }
  return `${sign}${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(abs)}`
}

export function formatPercent(value: number, digits = 0) {
  return `${new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)} %`
}

export function parseAmount(value: string) {
  let normalized = value.replace(/\s/g, '')
  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.')
  } else {
    const groups = normalized.split('.')
    if (groups.length > 2) normalized = groups.join('')
  }
  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

export function inputAmount(value: number) {
  if (!value) return ''
  return String(value).replace('.', ',')
}
