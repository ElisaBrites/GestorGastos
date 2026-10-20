import type { Transaction, Wallet } from '../types'
import { monthKey } from './dates'

export function walletBalance(wallet: Wallet, transactions: Transaction[]) {
  return transactions.reduce(
    (total, tx) =>
      tx.walletId === wallet.id
        ? total + (tx.type === 'income' ? tx.amount : -tx.amount)
        : total,
    wallet.initialBalance,
  )
}

export function walletBalances(wallets: Wallet[], transactions: Transaction[]) {
  const balances = new Map<string, number>()
  for (const wallet of wallets) balances.set(wallet.id, wallet.initialBalance)
  for (const tx of transactions) {
    const value = balances.get(tx.walletId)
    if (value === undefined) continue
    balances.set(tx.walletId, value + (tx.type === 'income' ? tx.amount : -tx.amount))
  }
  return balances
}

export function sumByType(transactions: Transaction[]) {
  let income = 0
  let expense = 0
  for (const tx of transactions) {
    if (tx.type === 'income') income += tx.amount
    else expense += tx.amount
  }
  return { income, expense, net: income - expense }
}

export function totalsForMonth(transactions: Transaction[], key: string) {
  return sumByType(transactions.filter((tx) => monthKey(tx.date) === key))
}

export function percentChange(current: number, previous: number): number | null {
  if (!previous) return current ? null : 0
  return ((current - previous) / Math.abs(previous)) * 100
}

export function groupByDate(transactions: Transaction[]) {
  const grouped = new Map<string, Transaction[]>()
  const sorted = [...transactions].sort((a, b) => {
    if (a.date === b.date) return a.createdAt < b.createdAt ? 1 : -1
    return a.date < b.date ? 1 : -1
  })
  for (const tx of sorted) {
    const list = grouped.get(tx.date) ?? []
    list.push(tx)
    grouped.set(tx.date, list)
  }
  return grouped
}
