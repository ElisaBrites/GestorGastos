import type { AppData } from '../types'
import { DEFAULT_SETTINGS } from './defaults'

const DATA_PREFIX = 'bolsillo.data.v1.'
const LEGACY_DATA_KEY = 'bolsillo.v1'
const LEGACY_IMPORT_MARKER = 'bolsillo.local-data-imported.v1'

function normalizeAppData(value: unknown, legacy = false): AppData | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const raw = value as Partial<AppData>
  if (!Array.isArray(raw.wallets) || !Array.isArray(raw.categories)) return null

  const settings = {
    ...DEFAULT_SETTINGS,
    ...(raw.settings && typeof raw.settings === 'object' ? raw.settings : {}),
  }

  // La versión anterior de Bolsillo usaba EUR como moneda inicial.
  if (legacy && settings.currency === 'EUR') settings.currency = 'ARS'

  return {
    wallets: raw.wallets.map((wallet) => ({
      ...wallet,
      includeInTotal: wallet.includeInTotal !== false,
    })),
    categories: raw.categories,
    transactions: Array.isArray(raw.transactions) ? raw.transactions : [],
    transfers: Array.isArray(raw.transfers) ? raw.transfers : [],
    recurring: Array.isArray(raw.recurring) ? raw.recurring : [],
    budgets: Array.isArray(raw.budgets) ? raw.budgets : [],
    settings,
  }
}

export function appDataFromStore(state: AppData): AppData {
  return {
    wallets: state.wallets,
    categories: state.categories,
    transactions: state.transactions,
    transfers: state.transfers,
    recurring: state.recurring,
    budgets: state.budgets,
    settings: state.settings,
  }
}

export function hasLocalUserData(userId: string) {
  try {
    return localStorage.getItem(`${DATA_PREFIX}${userId}`) !== null
  } catch {
    return false
  }
}

export function loadUserData(userId: string): AppData | null {
  try {
    const raw = localStorage.getItem(`${DATA_PREFIX}${userId}`)
    if (!raw) return null
    return normalizeAppData(JSON.parse(raw) as unknown)
  } catch {
    return null
  }
}

export function saveUserData(userId: string, data: AppData) {
  try {
    localStorage.setItem(`${DATA_PREFIX}${userId}`, JSON.stringify(data))
  } catch {
    // Si el almacenamiento está lleno, la app sigue funcionando en memoria.
  }
}

function readLegacyZustandData(): AppData | null {
  try {
    const raw = localStorage.getItem(LEGACY_DATA_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    const source =
      parsed && typeof parsed === 'object' && 'state' in parsed
        ? (parsed as { state: unknown }).state
        : parsed
    return normalizeAppData(source, true)
  } catch {
    return null
  }
}

function dataScore(data: AppData) {
  return (
    data.transactions.length +
    data.transfers.length +
    data.recurring.length +
    (data.budgets?.length ?? 0) +
    data.wallets.length +
    data.categories.length
  )
}

/**
 * Devuelve la mejor copia local disponible sin marcar la migración como hecha.
 * Se usa para ofrecer una importación manual desde Ajustes.
 */
export function getLocalBackupForImport(currentUserId?: string): AppData | null {
  try {
    let best = readLegacyZustandData()

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index)
      if (!key?.startsWith(DATA_PREFIX)) continue
      const userId = key.slice(DATA_PREFIX.length)
      if (userId === currentUserId) continue
      const data = loadUserData(userId)
      if (data && (!best || dataScore(data) > dataScore(best))) best = data
    }

    return best
  } catch {
    return null
  }
}

/**
 * Recupera datos de la versión local para la primera cuenta que se cree en
 * PostgreSQL. Se ejecuta una sola vez por navegador.
 */
export function getLegacyLocalData(): AppData | null {
  try {
    if (localStorage.getItem(LEGACY_IMPORT_MARKER)) return null

    const legacy = readLegacyZustandData()
    if (legacy) {
      localStorage.setItem(LEGACY_IMPORT_MARKER, '1')
      return legacy
    }

    let best: AppData | null = null
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index)
      if (!key?.startsWith(DATA_PREFIX)) continue
      const userId = key.slice(DATA_PREFIX.length)
      const data = loadUserData(userId)
      if (data && (!best || dataScore(data) > dataScore(best))) best = data
    }

    localStorage.setItem(LEGACY_IMPORT_MARKER, '1')
    return best
  } catch {
    return null
  }
}
