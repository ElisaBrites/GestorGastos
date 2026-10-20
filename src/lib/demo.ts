import type { AppData, Category, Recurring, Transaction, TxType, Wallet } from '../types'
import { addMonthsISO, advanceByFrequency, todayISO, toISO } from './dates'
import {
  createDefaultCategories,
  createDefaultWallets,
  DEFAULT_SETTINGS,
} from './defaults'
import { uid } from './utils'

function nextDayOfMonth(day: number) {
  const now = new Date()
  let candidate = new Date(now.getFullYear(), now.getMonth(), day)
  if (candidate.getTime() <= now.getTime()) {
    candidate = new Date(now.getFullYear(), now.getMonth() + 1, day)
  }
  return toISO(candidate)
}

/**
 * Genera un set de datos de ejemplo con seis meses de movimientos,
 * tres billeteras y varios fijos programados.
 */
export function createDemoData(): AppData {
  const wallets: Wallet[] = createDefaultWallets().map((wallet) => {
    if (wallet.type === 'bank') return { ...wallet, initialBalance: 1850 }
    if (wallet.type === 'cash') return { ...wallet, initialBalance: 120 }
    return wallet
  })
  wallets.push({
    id: uid(),
    name: 'Ahorros',
    type: 'savings',
    icon: 'PiggyBank',
    color: '#10b981',
    initialBalance: 4200,
    createdAt: new Date().toISOString(),
  })

  const categories = createDefaultCategories()
  const today = todayISO()
  const now = new Date()

  const category = (type: TxType, name: string) =>
    categories.find((c) => c.type === type && c.name === name)
  const sub = (cat: Category | undefined, name: string) =>
    cat?.subcategories.find((s) => s.name === name)?.id
  const wallet = (type: Wallet['type']) => wallets.find((w) => w.type === type)?.id ?? wallets[0].id

  const bank = wallet('bank')
  const cash = wallet('cash')
  const savings = wallet('savings')
  const catSalary = category('income', 'Salario')
  const catFreelance = category('income', 'Freelance')
  const catInvest = category('income', 'Inversiones')
  const catFood = category('expense', 'Alimentación')
  const catHome = category('expense', 'Vivienda')
  const catTransport = category('expense', 'Transporte')
  const catHealth = category('expense', 'Salud')
  const catLeisure = category('expense', 'Ocio')
  const catShopping = category('expense', 'Compras')
  const catPets = category('expense', 'Mascotas')

  const transactions: Transaction[] = []

  const add = (
    type: TxType,
    amount: number,
    date: string,
    cat: Category | undefined,
    subName: string,
    walletId: string,
    note?: string,
  ) => {
    if (!cat || date > today) return
    transactions.push({
      id: uid(),
      type,
      amount: Math.round(amount * 100) / 100,
      date,
      categoryId: cat.id,
      subcategoryId: sub(cat, subName),
      walletId,
      note,
      createdAt: new Date().toISOString(),
    })
  }

  for (let offset = 5; offset >= 0; offset--) {
    const base = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const year = base.getFullYear()
    const month = base.getMonth()
    const day = (d: number) => toISO(new Date(year, month, d))
    const variation = (offset % 3) * 6

    add('income', 2850, day(1), catSalary, 'Sueldo', bank, 'Nómina mensual')
    if (offset % 2 === 0) {
      add('income', 420 + offset * 35, day(14), catFreelance, 'Proyectos', bank, 'Proyecto web')
    }
    add('income', 32.5, day(28), catInvest, 'Dividendos', savings, 'Dividendos ETF')

    add('expense', 780, day(3), catHome, 'Alquiler', bank, 'Alquiler mensual')
    add('expense', 95 + variation, day(8), catHome, 'Servicios', bank, 'Luz y agua')
    add('expense', 39.9, day(9), catHome, 'Servicios', bank, 'Internet')
    add('expense', 12.99, day(5), catLeisure, 'Streaming', bank, 'Suscripción')

    add('expense', 92.4 + variation, day(4), catFood, 'Supermercado', bank)
    add('expense', 76.15, day(12), catFood, 'Supermercado', bank)
    add('expense', 104.3, day(20), catFood, 'Supermercado', bank)
    add('expense', 48.6, day(26), catFood, 'Supermercado', cash, 'Mercado')
    add('expense', 38.5, day(6), catFood, 'Restaurantes', bank)
    add('expense', 54 + variation, day(21), catFood, 'Restaurantes', bank)
    add('expense', 4.8, day(7), catFood, 'Café', cash)
    add('expense', 3.9, day(15), catFood, 'Café', cash)

    add('expense', 58, day(10), catTransport, 'Combustible', bank)
    add('expense', 52, day(24), catTransport, 'Combustible', bank)
    add('expense', 18.4, day(17), catHealth, 'Farmacia', bank)
    if (offset % 2 === 0) add('expense', 45, day(11), catPets, 'Veterinario', bank)
    if (offset % 3 === 1) add('expense', 65, day(18), catShopping, 'Ropa', bank)
    if (offset % 2 === 1) add('expense', 16, day(22), catLeisure, 'Cine', cash)
  }

  const recurring: Recurring[] = [
    {
      id: uid(),
      type: 'income',
      amount: 2850,
      categoryId: catSalary?.id ?? '',
      subcategoryId: sub(catSalary, 'Sueldo'),
      walletId: bank,
      note: 'Nómina mensual',
      frequency: 'monthly',
      startDate: todayISO(),
      nextDate: nextDayOfMonth(1),
      autoPost: true,
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(),
      type: 'expense',
      amount: 780,
      categoryId: catHome?.id ?? '',
      subcategoryId: sub(catHome, 'Alquiler'),
      walletId: bank,
      note: 'Alquiler',
      frequency: 'monthly',
      startDate: addMonthsISO(todayISO(), -1),
      nextDate: nextDayOfMonth(3),
      autoPost: true,
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(),
      type: 'expense',
      amount: 12.99,
      categoryId: catLeisure?.id ?? '',
      subcategoryId: sub(catLeisure, 'Streaming'),
      walletId: bank,
      note: 'Suscripción mensual',
      frequency: 'monthly',
      startDate: todayISO(),
      nextDate: nextDayOfMonth(5),
      autoPost: false,
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(),
      type: 'expense',
      amount: 145,
      categoryId: catHealth?.id ?? '',
      subcategoryId: sub(catHealth, 'Seguros'),
      walletId: bank,
      note: 'Seguro médico',
      frequency: 'quarterly',
      startDate: todayISO(),
      nextDate: advanceByFrequency(todayISO(), 'monthly'),
      autoPost: false,
      active: true,
      createdAt: new Date().toISOString(),
    },
  ]

  return {
    wallets,
    categories,
    transactions: transactions.sort((a, b) => (a.date < b.date ? 1 : -1)),
    recurring,
    settings: { ...DEFAULT_SETTINGS },
  }
}
