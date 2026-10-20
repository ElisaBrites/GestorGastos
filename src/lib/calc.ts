import type { Transaction, Transfer, Wallet } from '../types'
import { monthKey, todayISO } from './dates'

/**
 * Solo los movimientos con fecha de referencia o anterior forman parte del saldo.
 * La fecha de referencia permite consultar la situación financiera de un día concreto.
 */
export function settledTransactions(transactions: Transaction[], asOf = todayISO()) {
  return transactions.filter((tx) => tx.date <= asOf)
}

export function walletIsIncluded(wallet: Wallet) {
  return wallet.includeInTotal !== false
}

export function walletBalance(
  wallet: Wallet,
  transactions: Transaction[],
  transfers: Transfer[] = [],
  asOf = todayISO(),
) {
  let balance = wallet.initialBalance
  for (const tx of transactions) {
    if (tx.date > asOf || tx.walletId !== wallet.id) continue
    balance += tx.type === 'income' ? tx.amount : -tx.amount
  }
  for (const transfer of transfers) {
    if (transfer.date > asOf) continue
    if (transfer.fromWalletId === wallet.id) balance -= transfer.amount
    if (transfer.toWalletId === wallet.id) balance += transfer.amount
  }
  return balance
}

export function walletBalances(
  wallets: Wallet[],
  transactions: Transaction[],
  transfers: Transfer[] = [],
  asOf = todayISO(),
) {
  const balances = new Map<string, number>()
  for (const wallet of wallets) balances.set(wallet.id, wallet.initialBalance)
  for (const tx of transactions) {
    if (tx.date > asOf) continue
    const value = balances.get(tx.walletId)
    if (value === undefined) continue
    balances.set(tx.walletId, value + (tx.type === 'income' ? tx.amount : -tx.amount))
  }
  for (const transfer of transfers) {
    if (transfer.date > asOf) continue
    const from = balances.get(transfer.fromWalletId)
    if (from !== undefined) balances.set(transfer.fromWalletId, from - transfer.amount)
    const to = balances.get(transfer.toWalletId)
    if (to !== undefined) balances.set(transfer.toWalletId, to + transfer.amount)
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

