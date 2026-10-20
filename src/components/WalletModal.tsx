import { useEffect, useState, type FormEvent } from 'react'
import { Wallet as WalletIcon } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useUI } from '../store/useUI'
import { WALLET_COLORS, WALLET_TYPES, WALLET_TYPE_LABELS } from '../lib/defaults'
import { currencySymbol, parseAmount } from '../lib/format'
import { WALLET_ICONS } from '../lib/icons'
import type { Wallet, WalletType } from '../types'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { Input, Select } from './ui/Input'
import { ColorPicker } from './ui/ColorPicker'
import { IconPicker } from './ui/IconPicker'
import { CategoryIcon } from './ui/CategoryIcon'
import { Toggle } from './ui/Toggle'

export function WalletModal({
  open,
  onClose,
  wallet,
}: {
  open: boolean
  onClose: () => void
  wallet?: Wallet
}) {
  const currency = useStore((state) => state.settings.currency)
  const addWallet = useStore((state) => state.addWallet)
  const updateWallet = useStore((state) => state.updateWallet)
  const toast = useUI((state) => state.toast)

  const [name, setName] = useState('')
  const [type, setType] = useState<WalletType>('cash')
  const [initialBalance, setInitialBalance] = useState('0')
  const [icon, setIcon] = useState('Wallet')
  const [color, setColor] = useState(WALLET_COLORS[0])
  const [includeInTotal, setIncludeInTotal] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setName(wallet?.name ?? '')
    setType(wallet?.type ?? 'cash')
    setInitialBalance(wallet ? String(wallet.initialBalance).replace('.', ',') : '0')
    setIcon(wallet?.icon ?? 'Wallet')
    setColor(wallet?.color ?? WALLET_COLORS[0])
    setIncludeInTotal(wallet?.includeInTotal !== false)
    setError('')
  }, [open, wallet])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const clean = name.trim()
    if (!clean) {
      setError('Ponle un nombre a la billetera.')
      return
    }
    const payload = {
      name: clean,
      type,
      initialBalance: Math.round(parseAmount(initialBalance) * 100) / 100,
      icon,
      color,
      includeInTotal,
    }
    if (wallet) {
      updateWallet(wallet.id, payload)
      toast('Billetera actualizada.')
    } else {
      addWallet(payload)
      toast('Billetera creada.')
    }
    onClose()
  }

  const formId = 'wallet-form'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={wallet ? 'Editar billetera' : 'Nueva billetera'}
      description={
        wallet
          ? 'Actualiza los datos y el aspecto de tu billetera.'
          : 'Separa tu dinero en efectivo, cuentas, tarjetas o ahorros.'
      }
      icon={
        <span
          className="grid h-9 w-9 place-items-center rounded-xl"
          style={{ backgroundColor: `${color}22`, color }}
        >
          <WalletIcon size={18} />
        </span>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId}>
            {wallet ? 'Guardar cambios' : 'Crear billetera'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface2/60 p-3">
          <CategoryIcon icon={icon} color={color} size={44} radius={14} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-fg">
              {name.trim() || 'Mi nueva billetera'}
            </p>
            <p className="text-[11px] text-faint">{WALLET_TYPE_LABELS[type]}</p>
          </div>
          <span className="ml-auto text-[15px] font-semibold tnum text-fg">
            {currencySymbol(currency)} {initialBalance || '0'}
          </span>
        </div>

        <Input
          label="Nombre"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setError('')
          }}
          placeholder="Ej. Cuenta principal"
          maxLength={40}
          autoFocus
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Tipo de billetera"
            value={type}
            onChange={(event) => setType(event.target.value as WalletType)}
          >
            {WALLET_TYPES.map((item) => (
              <option key={item} value={item}>
                {WALLET_TYPE_LABELS[item]}
              </option>
            ))}
          </Select>
          <Input
            label="Saldo inicial"
            inputMode="decimal"
            value={initialBalance}
            onChange={(event) => setInitialBalance(event.target.value)}
            hint="Punto de partida antes de los movimientos."
          />
        </div>

        <div>
          <p className="label">Icono</p>
          <IconPicker value={icon} onChange={setIcon} icons={WALLET_ICONS} />
        </div>

        <div>
          <p className="label">Color</p>
          <ColorPicker value={color} onChange={setColor} colors={WALLET_COLORS} />
        </div>

        <div className="rounded-xl border border-line bg-surface2/60 p-3.5">
          <Toggle
            checked={includeInTotal}
            onChange={setIncludeInTotal}
            label="Incluir en el balance total"
            description="Desactívalo si quieres que esta billetera funcione por separado y no sume al total general."
          />
        </div>

        {error && (
          <p className="rounded-xl border border-expense/20 bg-expense-soft px-3 py-2 text-xs font-medium text-expense">
            {error}
          </p>
        )}
      </form>
    </Modal>
  )
}
