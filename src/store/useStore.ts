import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AppData,
  Category,
  CategoryInput,
  Recurring,
  RecurringInput,
  Settings,
  SubcategoryInput,
  Transaction,
  TransactionInput,
  Transfer,
  TransferInput,
  Wallet,
  WalletInput,
} from '../types'
import {
  createDefaultCategories,
  createDefaultWallets,
  DEFAULT_SETTINGS,
} from '../lib/defaults'
import { createDemoData } from '../lib/demo'
import { advanceByFrequency, todayISO } from '../lib/dates'
import { uid } from '../lib/utils'

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string }

interface AppStore extends AppData {
  addWallet: (input: WalletInput) => string
  updateWallet: (id: string, input: WalletInput) => void
  deleteWallet: (id: string) => ActionResult
  setWalletIncluded: (id: string, includeInTotal: boolean) => void

  addCategory: (input: CategoryInput) => string
  updateCategory: (id: string, input: CategoryInput) => void
  deleteCategory: (id: string) => ActionResult
  addSubcategory: (categoryId: string, input: SubcategoryInput) => ActionResult
  updateSubcategory: (
    categoryId: string,
    subcategoryId: string,
    input: SubcategoryInput,
  ) => ActionResult
  deleteSubcategory: (categoryId: string, subcategoryId: string) => void

  addTransaction: (input: TransactionInput) => string
  updateTransaction: (id: string, input: TransactionInput) => void
  deleteTransaction: (id: string) => void

  addTransfer: (input: TransferInput) => string
  updateTransfer: (id: string, input: TransferInput) => void
  deleteTransfer: (id: string) => void

  addRecurring: (input: RecurringInput) => string
  updateRecurring: (id: string, input: RecurringInput) => void
  deleteRecurring: (id: string) => void
  toggleRecurring: (id: string) => void
  postRecurringNow: (id: string) => ActionResult
  processRecurring: () => number

  setSettings: (patch: Partial<Settings>) => void
  replaceData: (data: AppData) => void
  loadDemo: () => void
  resetAll: () => void
}

function initialData(): AppData {
  return {
    wallets: createDefaultWallets(),
    categories: createDefaultCategories(),
    transactions: [],
    transfers: [],
    recurring: [],
    settings: { ...DEFAULT_SETTINGS },
  }
}

function buildTransaction(input: TransactionInput): Transaction {
  return {
    ...input,
    id: uid(),
    createdAt: new Date().toISOString(),
  }
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialData(),

      addWallet: (input) => {
        const id = uid()
        set((state) => ({
          wallets: [
            ...state.wallets,
            {
              ...input,
              id,
              includeInTotal: input.includeInTotal !== false,
              createdAt: new Date().toISOString(),
            },
          ],
        }))
        return id
      },

      updateWallet: (id, input) => {
        set((state) => ({
          wallets: state.wallets.map((wallet) =>
            wallet.id === id ? { ...wallet, ...input } : wallet,
          ),
        }))
      },

      setWalletIncluded: (id, includeInTotal) => {
        set((state) => ({
          wallets: state.wallets.map((wallet) =>
            wallet.id === id ? { ...wallet, includeInTotal } : wallet,
          ),
        }))
      },

      deleteWallet: (id) => {
        const state = get()
        const usedByTx = state.transactions.some((tx) => tx.walletId === id)
        const usedByRecurring = state.recurring.some((item) => item.walletId === id)
        const usedByTransfer = state.transfers.some(
          (transfer) => transfer.fromWalletId === id || transfer.toWalletId === id,
        )
        if (usedByTx || usedByRecurring || usedByTransfer) {
          return {
            ok: false,
            error:
              'Esta billetera tiene movimientos, transferencias o fijos asociados. Elimina o mueve esos registros primero.',
          }
        }
        set({ wallets: state.wallets.filter((wallet) => wallet.id !== id) })
        return { ok: true }
      },

      addCategory: (input) => {
        const id = uid()
        const category: Category = {
          ...input,
          id,
          subcategories: [],
        }
        set((state) => ({ categories: [...state.categories, category] }))
        return id
      },

      updateCategory: (id, input) => {
        set((state) => ({
          categories: state.categories.map((category) =>
            category.id === id ? { ...category, ...input } : category,
          ),
        }))
      },

      deleteCategory: (id) => {
        const state = get()
        const usedByTx = state.transactions.some((tx) => tx.categoryId === id)
        const usedByRecurring = state.recurring.some((item) => item.categoryId === id)
        if (usedByTx || usedByRecurring) {
          return {
            ok: false,
            error:
              'Esta categoría tiene movimientos o fijos asociados. Elimina o cambia esos registros primero.',
          }
        }
        set({ categories: state.categories.filter((category) => category.id !== id) })
        return { ok: true }
      },

      addSubcategory: (categoryId, input) => {
        const clean = input.name.trim()
        if (!clean) return { ok: false, error: 'Escribe un nombre para la subcategoría.' }
        const state = get()
        const category = state.categories.find((item) => item.id === categoryId)
        if (!category) return { ok: false, error: 'La categoría no existe.' }
        const exists = category.subcategories.some(
          (sub) => sub.name.toLowerCase() === clean.toLowerCase(),
        )
        if (exists) return { ok: false, error: 'Esa subcategoría ya existe.' }
        const id = uid()
        set({
          categories: state.categories.map((item) =>
            item.id === categoryId
              ? {
                  ...item,
                  subcategories: [
                    ...item.subcategories,
                    {
                      id,
                      name: clean,
                      icon: input.icon ?? category.icon,
                      color: input.color ?? category.color,
                    },
                  ],
                }
              : item,
          ),
        })
        return { ok: true, id }
      },

      updateSubcategory: (categoryId, subcategoryId, input) => {
        const clean = input.name.trim()
        if (!clean) return { ok: false, error: 'Escribe un nombre para la subcategoría.' }
        const state = get()
        const category = state.categories.find((item) => item.id === categoryId)
        if (!category) return { ok: false, error: 'La categoría no existe.' }
        const subcategory = category.subcategories.find((sub) => sub.id === subcategoryId)
        if (!subcategory) return { ok: false, error: 'La subcategoría no existe.' }
        const exists = category.subcategories.some(
          (sub) =>
            sub.id !== subcategoryId && sub.name.toLowerCase() === clean.toLowerCase(),
        )
        if (exists) return { ok: false, error: 'Esa subcategoría ya existe.' }
        set({
          categories: state.categories.map((item) =>
            item.id === categoryId
              ? {
                  ...item,
                  subcategories: item.subcategories.map((sub) =>
                    sub.id === subcategoryId
                      ? {
                          ...sub,
                          name: clean,
                          icon: input.icon ?? sub.icon,
                          color: input.color ?? sub.color,
                        }
                      : sub,
                  ),
                }
              : item,
          ),
        })
        return { ok: true }
      },

      deleteSubcategory: (categoryId, subcategoryId) => {
        set((state) => ({
          categories: state.categories.map((category) =>
            category.id === categoryId
              ? {
                  ...category,
                  subcategories: category.subcategories.filter(
                    (sub) => sub.id !== subcategoryId,
                  ),
                }
              : category,
          ),
          transactions: state.transactions.map((tx) =>
            tx.subcategoryId === subcategoryId ? { ...tx, subcategoryId: undefined } : tx,
          ),
          recurring: state.recurring.map((item) =>
            item.subcategoryId === subcategoryId
              ? { ...item, subcategoryId: undefined }
              : item,
          ),
        }))
      },

      addTransaction: (input) => {
        const tx = buildTransaction(input)
        set((state) => ({ transactions: [...state.transactions, tx] }))
        return tx.id
      },

      updateTransaction: (id, input) => {
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id
              ? {
                  ...tx,
                  ...input,
                  id,
                  createdAt: tx.createdAt,
                  recurringId: input.recurringId ?? tx.recurringId,
                }
              : tx,
          ),
        }))
      },

      deleteTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.id !== id),
        }))
      },

      addTransfer: (input) => {
        const id = uid()
        const transfer: Transfer = {
          ...input,
          id,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ transfers: [...state.transfers, transfer] }))
        return id
      },

      updateTransfer: (id, input) => {
        set((state) => ({
          transfers: state.transfers.map((transfer) =>
            transfer.id === id
              ? { ...transfer, ...input, id, createdAt: transfer.createdAt }
              : transfer,
          ),
        }))
      },

      deleteTransfer: (id) => {
        set((state) => ({
          transfers: state.transfers.filter((transfer) => transfer.id !== id),
        }))
      },

      addRecurring: (input) => {
        const id = uid()
        const item: Recurring = {
          ...input,
          id,
          startDate: input.nextDate,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ recurring: [...state.recurring, item] }))
        return id
      },

      updateRecurring: (id, input) => {
        set((state) => ({
          recurring: state.recurring.map((item) =>
            item.id === id ? { ...item, ...input } : item,
          ),
        }))
      },

      deleteRecurring: (id) => {
        set((state) => ({
          recurring: state.recurring.filter((item) => item.id !== id),
        }))
      },

      toggleRecurring: (id) => {
        set((state) => ({
          recurring: state.recurring.map((item) =>
            item.id === id ? { ...item, active: !item.active } : item,
          ),
        }))
      },

      postRecurringNow: (id) => {
        const state = get()
        const item = state.recurring.find((rec) => rec.id === id)
        if (!item) return { ok: false, error: 'El movimiento fijo no existe.' }
        const today = todayISO()
        if (
          state.transactions.some(
            (tx) => tx.recurringId === item.id && tx.date === today,
          )
        ) {
          return { ok: false, error: 'Ya registraste este movimiento fijo hoy.' }
        }

        const tx: Transaction = {
          id: uid(),
          type: item.type,
          amount: item.amount,
          date: today,
          categoryId: item.categoryId,
          subcategoryId: item.subcategoryId,
          walletId: item.walletId,
          note: item.note,
          recurringId: item.id,
          createdAt: new Date().toISOString(),
        }

        let next = item.nextDate
        if (next > today) {
          next = advanceByFrequency(next, item.frequency)
        } else {
          let guard = 0
          while (next <= today && guard < 240) {
            next = advanceByFrequency(next, item.frequency)
            guard++
          }
        }
        const active = item.endDate ? next <= item.endDate : item.active

        set({
          transactions: [...state.transactions, tx],
          recurring: state.recurring.map((rec) =>
            rec.id === id ? { ...rec, nextDate: next, active } : rec,
          ),
        })
        return { ok: true }
      },

      processRecurring: () => {
        const today = todayISO()
        let created = 0
        set((state) => {
          const newTransactions: Transaction[] = []
          const recurring = state.recurring.map((item) => {
            if (!item.active || !item.autoPost) return item
            let nextDate = item.nextDate
            let active: boolean = item.active
            let guard = 0
            while (nextDate <= today && guard < 120) {
              if (item.endDate && nextDate > item.endDate) {
                active = false
                break
              }
              newTransactions.push({
                id: uid(),
                type: item.type,
                amount: item.amount,
                date: nextDate,
                categoryId: item.categoryId,
                subcategoryId: item.subcategoryId,
                walletId: item.walletId,
                note: item.note,
                recurringId: item.id,
                createdAt: new Date().toISOString(),
              })
              nextDate = advanceByFrequency(nextDate, item.frequency)
              guard++
            }
            if (item.endDate && nextDate > item.endDate) active = false
            if (nextDate === item.nextDate && active === item.active) return item
            return { ...item, nextDate, active }
          })
          created = newTransactions.length
          return {
            transactions: newTransactions.length
              ? [...state.transactions, ...newTransactions]
              : state.transactions,
            recurring,
          }
        })
        return created
      },

      setSettings: (patch) => {
        set((state) => ({ settings: { ...state.settings, ...patch } }))
      },

      replaceData: (data) => {
        set({
          wallets: Array.isArray(data.wallets)
            ? data.wallets.map((wallet) => ({
                ...wallet,
                includeInTotal: wallet.includeInTotal !== false,
              }))
            : [],
          categories: Array.isArray(data.categories) ? data.categories : [],
          transactions: Array.isArray(data.transactions) ? data.transactions : [],
          transfers: Array.isArray(data.transfers) ? data.transfers : [],
          recurring: Array.isArray(data.recurring) ? data.recurring : [],
          settings: { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) },
        })
      },

      loadDemo: () => {
        const demo = createDemoData()
        set({ ...demo, settings: get().settings })
      },

      resetAll: () => {
        set({ ...initialData() })
      },
    }),
    {
      name: 'bolsillo.v1',
      version: 1,
      merge: (persisted, current) => {
        const data = (persisted ?? {}) as Partial<AppData>
        return {
          ...current,
          ...data,
          wallets: (Array.isArray(data.wallets) ? data.wallets : current.wallets).map(
            (wallet) => ({
              ...wallet,
              includeInTotal: wallet.includeInTotal !== false,
            }),
          ),
          transfers: Array.isArray(data.transfers) ? data.transfers : [],
          settings: { ...current.settings, ...(data.settings ?? {}) },
        }
      },
    },
  ),
)


