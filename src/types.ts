export type TxType = 'income' | 'expense'

export type WalletType = 'cash' | 'bank' | 'card' | 'savings' | 'investment' | 'other'

export type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'

export type ThemeMode = 'light' | 'dark' | 'system'

export interface Subcategory {
  id: string
  name: string
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

export interface Settings {
  theme: ThemeMode
  currency: string
}

export interface AppData {
  wallets: Wallet[]
  categories: Category[]
  transactions: Transaction[]
  recurring: Recurring[]
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

export interface CategoryInput {
  name: string
  type: TxType
  icon: string
  color: string
}

export interface WalletInput {
  name: string
  type: WalletType
  icon: string
  color: string
  initialBalance: number
}
