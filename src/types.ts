export type TxType = 'income' | 'expense'

export type WalletType = 'cash' | 'bank' | 'card' | 'savings' | 'investment' | 'other'

export type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'

export type ThemeMode = 'light' | 'dark' | 'system'

export interface Subcategory {
  id: string
  name: string
  /** Icono propio; si falta, se hereda el de la categoría. */
  icon?: string
  /** Color propio; si falta, se hereda el de la categoría. */
  color?: string
}

export interface Category {
  id: string
  name: string
  type: TxType
  icon: string
  color: string
  subcategories: Subcategory[]
}

export interface Wallet {
  id: string
  name: string
  type: WalletType
  icon: string
  color: string
  initialBalance: number
  /** Si es false, la billetera no suma en el balance total. */
  includeInTotal?: boolean
  createdAt: string
}

export interface Transaction {
  id: string
  type: TxType
  amount: number
  date: string
  categoryId: string
  subcategoryId?: string
  walletId: string
  note?: string
  recurringId?: string
  createdAt: string
}

export interface Transfer {
  id: string
  amount: number
  date: string
  fromWalletId: string
  toWalletId: string
  note?: string
  createdAt: string
}

export interface Recurring {
  id: string
  type: TxType
  amount: number
  categoryId: string
  subcategoryId?: string
  walletId: string
  note?: string
  frequency: Frequency
  startDate: string
  nextDate: string
  endDate?: string
  autoPost: boolean
  active: boolean
  createdAt: string
}

export interface Budget {
  id: string
  /** Categoría de gasto a la que se aplica el presupuesto. */
  categoryId: string
  /** Si falta, el presupuesto controla la categoría completa. */
  subcategoryId?: string
  amount: number
  startDate: string
  endDate: string
  createdAt: string
}

export interface Settings {
  theme: ThemeMode
  currency: string
}

export interface AppData {
  wallets: Wallet[]
  categories: Category[]
  transactions: Transaction[]
  transfers: Transfer[]
  recurring: Recurring[]
  budgets: Budget[]
  settings: Settings
}

export type TransactionInput = Omit<Transaction, 'id' | 'createdAt' | 'recurringId'> &
  Partial<Pick<Transaction, 'recurringId'>>

export interface RecurringInput {
  type: TxType
  amount: number
  categoryId: string
  subcategoryId?: string
  walletId: string
  note?: string
  frequency: Frequency
  nextDate: string
  endDate?: string
  autoPost: boolean
  active: boolean
}

export interface BudgetInput {
  categoryId: string
  subcategoryId?: string
  amount: number
  startDate: string
  endDate: string
}

export interface CategoryInput {
  name: string
  type: TxType
  icon: string
  color: string
}

export interface SubcategoryInput {
  name: string
  icon?: string
  color?: string
}

export interface WalletInput {
  name: string
  type: WalletType
  icon: string
  color: string
  initialBalance: number
  includeInTotal?: boolean
}

export interface TransferInput {
  amount: number
  date: string
  fromWalletId: string
  toWalletId: string
  note?: string
}
