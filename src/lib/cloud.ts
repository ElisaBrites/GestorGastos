import type { AppData } from '../types'
import { api } from './api'

const PENDING_PREFIX = 'bolsillo.cloud-pending.v1.'

export function markCloudPending(userId: string) {
  try {
    localStorage.setItem(`${PENDING_PREFIX}${userId}`, '1')
  } catch {
    // La copia local sigue funcionando aunque no se pueda marcar la sincronización.
  }
}

export function clearCloudPending(userId: string) {
  try {
    localStorage.removeItem(`${PENDING_PREFIX}${userId}`)
  } catch {
    // Ignorar errores de almacenamiento.
  }
}

export function hasCloudPending(userId: string) {
  try {
    return localStorage.getItem(`${PENDING_PREFIX}${userId}`) === '1'
  } catch {
    return false
  }
}

export function appDataFromStore(state: AppData): AppData {
  return {
    wallets: state.wallets,
    categories: state.categories,
    transactions: state.transactions,
    transfers: state.transfers,
    recurring: state.recurring,
    settings: state.settings,
  }
}

export async function fetchCloudData(): Promise<AppData | null> {
  const result = await api<{ data: AppData | null }>('/api/data')
  return result.data
}

export async function saveCloudData(data: AppData): Promise<void> {
  await api('/api/data', {
    method: 'PUT',
    body: JSON.stringify({ data }),
  })
}
