import { create } from 'zustand'
import type { TxType } from '../types'
import { uid } from '../lib/utils'

export type ToastTone = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  tone: ToastTone
}

interface TransactionModalState {
  open: boolean
  editId?: string
  defaultType?: TxType
}

interface UIStore {
  txModal: TransactionModalState
  openTransactionModal: (options?: { editId?: string; type?: TxType }) => void
  closeTransactionModal: () => void
  toasts: Toast[]
  toast: (message: string, tone?: ToastTone) => void
  dismissToast: (id: string) => void
}

export const useUI = create<UIStore>()((set, get) => ({
  txModal: { open: false },
  openTransactionModal: (options) =>
    set({
      txModal: {
        open: true,
        editId: options?.editId,
        defaultType: options?.type,
      },
    }),
  closeTransactionModal: () => set({ txModal: { open: false } }),
  toasts: [],
  toast: (message, tone = 'success') => {
    const id = uid()
    set((state) => ({ toasts: [...state.toasts, { id, message, tone }] }))
    window.setTimeout(() => {
      get().dismissToast(id)
    }, 3600)
  },
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}))
