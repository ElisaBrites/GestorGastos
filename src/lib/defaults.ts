import type { Category, Frequency, Settings, Wallet, WalletType } from '../types'
import { uid } from './utils'

export const CATEGORY_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#64748b',
]

export const WALLET_COLORS = [
  '#0ea5e9',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#64748b',
  '#0f172a',
]

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  yearly: 'Anual',
}

export const FREQUENCIES = Object.keys(FREQUENCY_LABELS) as Frequency[]

export const WALLET_TYPE_LABELS: Record<WalletType, string> = {
  cash: 'Efectivo',
  bank: 'Cuenta bancaria',
  card: 'Tarjeta',
  savings: 'Ahorros',
  investment: 'Inversión',
  other: 'Otra',
}

export const WALLET_TYPES = Object.keys(WALLET_TYPE_LABELS) as WalletType[]

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  currency: 'ARS',
}

export function createDefaultWallets(): Wallet[] {
  return [
    {
      id: uid(),
      name: 'Efectivo',
      type: 'cash',
      icon: 'Wallet',
      color: '#f59e0b',
      initialBalance: 0,
      includeInTotal: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(),
      name: 'Cuenta bancaria',
      type: 'bank',
      icon: 'Landmark',
      color: '#6366f1',
      initialBalance: 0,
      includeInTotal: true,
      createdAt: new Date().toISOString(),
    },
  ]
}

export function createDefaultCategories(): Category[] {
  return [
    {
      id: uid(),
      name: 'Alimentación',
      type: 'expense',
      icon: 'Utensils',
      color: '#f97316',
      subcategories: [
        { id: uid(), name: 'Supermercado' },
        { id: uid(), name: 'Restaurantes' },
        { id: uid(), name: 'Café' },
        { id: uid(), name: 'Panadería' },
      ],
    },
    {
      id: uid(),
      name: 'Vivienda',
      type: 'expense',
      icon: 'Home',
      color: '#8b5cf6',
      subcategories: [
        { id: uid(), name: 'Alquiler' },
        { id: uid(), name: 'Servicios' },
        { id: uid(), name: 'Mantenimiento' },
      ],
    },
    {
      id: uid(),
      name: 'Transporte',
      type: 'expense',
      icon: 'Car',
      color: '#3b82f6',
      subcategories: [
        { id: uid(), name: 'Combustible' },
        { id: uid(), name: 'Transporte público' },
        { id: uid(), name: 'Taxi' },
        { id: uid(), name: 'Estacionamiento' },
      ],
    },
    {
      id: uid(),
      name: 'Salud',
      type: 'expense',
      icon: 'HeartPulse',
      color: '#ef4444',
      subcategories: [
        { id: uid(), name: 'Farmacia' },
        { id: uid(), name: 'Consultas' },
        { id: uid(), name: 'Seguros' },
      ],
    },
    {
      id: uid(),
      name: 'Ocio',
      type: 'expense',
      icon: 'Gamepad2',
      color: '#ec4899',
      subcategories: [
        { id: uid(), name: 'Streaming' },
        { id: uid(), name: 'Cine' },
        { id: uid(), name: 'Salidas' },
        { id: uid(), name: 'Viajes' },
      ],
    },
    {
      id: uid(),
      name: 'Compras',
      type: 'expense',
      icon: 'ShoppingBag',
      color: '#14b8a6',
      subcategories: [
        { id: uid(), name: 'Ropa' },
        { id: uid(), name: 'Tecnología' },
        { id: uid(), name: 'Hogar' },
      ],
    },
    {
      id: uid(),
      name: 'Educación',
      type: 'expense',
      icon: 'GraduationCap',
      color: '#eab308',
      subcategories: [
        { id: uid(), name: 'Cursos' },
        { id: uid(), name: 'Libros' },
      ],
    },
    {
      id: uid(),
      name: 'Mascotas',
      type: 'expense',
      icon: 'PawPrint',
      color: '#a16207',
      subcategories: [
        { id: uid(), name: 'Comida' },
        { id: uid(), name: 'Veterinario' },
      ],
    },
    {
      id: uid(),
      name: 'Otros gastos',
      type: 'expense',
      icon: 'Tag',
      color: '#64748b',
      subcategories: [{ id: uid(), name: 'Varios' }],
    },
    {
      id: uid(),
      name: 'Salario',
      type: 'income',
      icon: 'Briefcase',
      color: '#10b981',
      subcategories: [
        { id: uid(), name: 'Sueldo' },
        { id: uid(), name: 'Bonos' },
        { id: uid(), name: 'Aguinaldo' },
      ],
    },
    {
      id: uid(),
      name: 'Freelance',
      type: 'income',
      icon: 'Laptop',
      color: '#06b6d4',
      subcategories: [
        { id: uid(), name: 'Proyectos' },
        { id: uid(), name: 'Consultoría' },
      ],
    },
    {
      id: uid(),
      name: 'Inversiones',
      type: 'income',
      icon: 'TrendingUp',
      color: '#22c55e',
      subcategories: [
        { id: uid(), name: 'Dividendos' },
        { id: uid(), name: 'Intereses' },
      ],
    },
    {
      id: uid(),
      name: 'Otros ingresos',
      type: 'income',
      icon: 'HandCoins',
      color: '#84cc16',
      subcategories: [
        { id: uid(), name: 'Regalos' },
        { id: uid(), name: 'Ventas' },
        { id: uid(), name: 'Reembolsos' },
      ],
    },
  ]
}
