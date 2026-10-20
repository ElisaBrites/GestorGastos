import type { AppData } from '../types'
import { api } from './api'

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
