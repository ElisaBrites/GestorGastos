import { useEffect, useState, type FormEvent } from 'react'
import {
  ArrowLeftRight,
  CalendarDays,
  Clock3,
  Trash2,
  Wallet as WalletIcon,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { useUI } from '../store/useUI'
import { walletBalance } from '../lib/calc'
import { formatFullDate, todayISO } from '../lib/dates'
import { WALLET_TYPE_LABELS } from '../lib/defaults'
import { currencySymbol, formatMoney, parseAmount } from '../lib/format'
import { Button } from './ui/Button'
import { ConfirmDialog } from './ui/ConfirmDialog'
import { Input } from './ui/Input'
import { VisualSelect } from './ui/VisualSelect'
import { Modal } from './ui/Modal'

export function TransferModal() {
  const { open, editId } = useUI((state) => state.transferModal)
  const close = useUI((state) => state.closeTransferModal)
  const toast = useUI((state) => state.toast)

  const wallets = useStore((state) => state.wallets)
  const transactions = useStore((state) => state.transactions)
  const transfers = useStore((state) => state.transfers)
  const currency = useStore((state) => state.settings.currency)
  const addTransfer = useStore((state) => state.addTransfer)
  const updateTransfer = useStore((state) => state.updateTransfer)
  const deleteTransfer = useStore((state) => state.deleteTransfer)

  const editing = editId ? transfers.find((transfer) => transfer.id === editId) : undefined

  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayISO())
  const [fromWalletId, setFromWalletId] = useState('')
  const [toWalletId, setToWalletId] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!open) return
    const first = wallets[0]?.id ?? ''
    const second = wallets.find((wallet) => wallet.id !== first)?.id ?? ''
    setAmount(editing ? String(editing.amount).replace('.', ',') : '')
    setDate(editing?.date ?? todayISO())
    setFromWalletId(editing?.fromWalletId ?? first)
    setToWalletId(editing?.toWalletId ?? second)
    setNote(editing?.note ?? '')
    setError('')
    setConfirmDelete(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editId])

  const fromWallet = wallets.find((wallet) => wallet.id === fromWalletId)
  const toWallet = wallets.find((wallet) => wallet.id === toWalletId)
  const fromBalance = fromWallet
    ? walletBalance(fromWallet, transactions, transfers)
    : 0
  const toBalance = toWallet ? walletBalance(toWallet, transactions, transfers) : 0
  const scheduled = Boolean(date) && date > todayISO()
  const symbol = currencySymbol(currency)
  const formId = 'transfer-form'
  const canTransfer = wallets.length >= 2

  const walletOptions = wallets.map((wallet) => ({
    value: wallet.id,
    label: wallet.name,
    icon: wallet.icon,
    color: wallet.color,
    description: WALLET_TYPE_LABELS[wallet.type],
  }))
  const destinationOptions = wallets
    .filter((wallet) => wallet.id !== fromWalletId)
    .map((wallet) => ({
      value: wallet.id,
      label: wallet.name,
      icon: wallet.icon,
      color: wallet.color,
      description: WALLET_TYPE_LABELS[wallet.type],
    }))

  const handleFromChange = (nextId: string) => {
    setFromWalletId(nextId)
    setError('')
    if (nextId === toWalletId) {
      const alternative = wallets.find((wallet) => wallet.id !== nextId)?.id ?? ''
      setToWalletId(alternative)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const value = parseAmount(amount)
    if (!value || value <= 0) {
      setError('Introduce un importe mayor que cero.')
      return
    }
    if (!fromWalletId || !toWalletId) {
      setError('Selecciona las dos billeteras.')
      return
    }
    if (fromWalletId === toWalletId) {
      setError('La billetera de origen y la de destino deben ser distintas.')
      return
    }
    if (!date) {
      setError('Selecciona una fecha.')
      return
    }

    const payload = {
      amount: Math.round(value * 100) / 100,
      date,
      fromWalletId,
      toWalletId,
      note: note.trim() || undefined,
    }

    if (editing) {
      updateTransfer(editing.id, payload)
      toast('Transferencia actualizada.')
    } else {
      addTransfer(payload)
      toast(scheduled ? 'Transferencia programada.' : 'Transferencia realizada.')
    }
    close()
  }

  const handleDelete = () => {
    if (!editing) return
    deleteTransfer(editing.id)
    toast('Transferencia eliminada.')
    close()
  }

  return (
    <>
      <Modal
        open={open}
        onClose={close}
        title={editing ? 'Editar transferencia' : 'Transferir entre billeteras'}
        description={
          editing
            ? 'Ajusta el importe, las billeteras o la fecha de la transferencia.'
            : 'Mueve dinero de una billetera a otra sin contarlo como ingreso ni gasto.'
        }
        icon={
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
            <ArrowLeftRight size={18} />
          </span>
        }
        footer={
          <>
            {editing && (
              <Button
                variant="ghost"
                className="mr-auto gap-1.5 text-expense hover:bg-expense-soft hover:text-expense"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 size={15} />
                Eliminar
              </Button>
            )}
            <Button variant="secondary" onClick={close}>
              Cancelar
            </Button>
            <Button type="submit" form={formId} disabled={!canTransfer}>
              {editing ? 'Guardar cambios' : scheduled ? 'Programar transferencia' : 'Transferir'}
            </Button>
          </>
        }
      >
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          {!canTransfer && (
            <p className="rounded-xl border border-warn/20 bg-warn-soft px-3 py-2 text-xs text-warn">
              Necesitas al menos dos billeteras para hacer una transferencia.
            </p>
          )}

          <div>
            <label className="label" htmlFor="transfer-amount">
              Importe
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-medium text-faint">
                {symbol}
              </span>
              <input
                id="transfer-amount"
                inputMode="decimal"
                autoComplete="off"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value)
                  setError('')
                }}
                placeholder="0,00"
                className="field h-14 pl-10 text-[24px] font-semibold tnum"
                autoFocus
              />
            </div>
            {fromWallet && (
              <p className="mt-1.5 text-[11px] text-faint">
                Saldo actual en {fromWallet.name}: {formatMoney(fromBalance, currency)}
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <VisualSelect
              label="Desde"
              value={fromWalletId}
              onChange={handleFromChange}
              options={walletOptions}
              placeholder="Sin billeteras"
              disabled={!canTransfer}
              hint={fromWallet ? `Saldo: ${formatMoney(fromBalance, currency)}` : undefined}
            />
            <VisualSelect
              label="Hasta"
              value={toWalletId}
              onChange={(next) => {
                setToWalletId(next)
                setError('')
              }}
              options={destinationOptions}
              placeholder="Sin otra billetera"
              emptyLabel="Necesitas otra billetera de destino."
              disabled={!canTransfer}
              hint={toWallet ? `Saldo: ${formatMoney(toBalance, currency)}` : undefined}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Fecha"
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value)
                setError('')
              }}
              disabled={!canTransfer}
            />
            <Input
              label="Nota (opcional)"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ej. Ahorro mensual"
              maxLength={120}
              disabled={!canTransfer}
            />
          </div>

          {scheduled && canTransfer && (
            <div className="flex items-start gap-2.5 rounded-xl border border-warn/20 bg-warn-soft px-3 py-2.5 text-[11px] leading-relaxed text-warn">
              <Clock3 size={14} className="mt-0.5 shrink-0" />
              <span>
                La transferencia quedará programada para el {formatFullDate(date)} y no
                modificará los saldos hasta ese día.
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 rounded-xl border border-line bg-surface2/60 px-3 py-2.5 text-[11px] text-muted">
            <CalendarDays size={14} className="shrink-0 text-faint" />
            <span className="min-w-0 flex-1 truncate">
              {fromWallet?.name ?? 'Origen'} → {toWallet?.name ?? 'Destino'}
            </span>
            <span className="flex items-center gap-1.5 text-faint">
              <WalletIcon size={13} />
              {wallets.length} billeteras
            </span>
          </div>

          {error && (
            <p className="rounded-xl border border-expense/20 bg-expense-soft px-3 py-2 text-xs font-medium text-expense">
              {error}
            </p>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Eliminar transferencia"
        description="Esta acción no se puede deshacer. Los saldos de las dos billeteras volverán a su estado anterior."
        confirmLabel="Eliminar"
      />
    </>
  )
}
