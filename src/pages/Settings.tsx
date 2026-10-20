import { useRef, useState, type ChangeEvent } from 'react'
import {
  Check,
  CheckCircle2,
  Cloud,
  CloudOff,
  Coins,
  Database,
  Download,
  LogOut,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Upload,
  UserRound,
  WifiOff,
} from 'lucide-react'
import { useAuth } from '../store/useAuth'
import { useStore } from '../store/useStore'
import { useUI } from '../store/useUI'
import { appDataFromStore, saveCloudData } from '../lib/cloud'
import { CURRENCIES, formatMoney } from '../lib/format'
import { DEFAULT_SETTINGS } from '../lib/defaults'
import { todayISO } from '../lib/dates'
import { useInstallPrompt } from '../lib/useInstallPrompt'
import { cn } from '../lib/utils'
import type { AppData, ThemeMode } from '../types'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Input'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

function ThemeMini({ theme }: { theme: ThemeMode }) {
  const isDark = theme === 'dark'
  return (
    <div
      className="flex h-16 overflow-hidden rounded-lg border border-line"
      style={{
        background:
          theme === 'system'
            ? 'linear-gradient(90deg, #eef1f5 50%, #0b0f15 50%)'
            : isDark
              ? '#0b0f15'
              : '#eef1f5',
      }}
    >
      <div
        className="m-1.5 w-4 rounded"
        style={{ background: isDark ? '#1a2230' : '#ffffff' }}
      />
      <div className="flex-1 space-y-1 p-1.5 pl-0">
        <div
          className="h-1.5 w-3/4 rounded"
          style={{ background: isDark ? '#2a3546' : '#d5dbe4' }}
        />
        <div
          className="h-1.5 w-1/2 rounded"
          style={{ background: isDark ? '#202a38' : '#e0e4eb' }}
        />
        <div
          className="h-4 w-full rounded"
          style={{ background: isDark ? '#1c2531' : '#ffffff' }}
        />
      </div>
    </div>
  )
}

function isTheme(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function Settings() {
  const settings = useStore((state) => state.settings)
  const wallets = useStore((state) => state.wallets)
  const categories = useStore((state) => state.categories)
  const transactions = useStore((state) => state.transactions)
  const transfers = useStore((state) => state.transfers)
  const recurring = useStore((state) => state.recurring)
  const setSettings = useStore((state) => state.setSettings)
  const replaceData = useStore((state) => state.replaceData)
  const loadDemo = useStore((state) => state.loadDemo)
  const resetAll = useStore((state) => state.resetAll)
  const toast = useUI((state) => state.toast)
  const { canInstall, isInstalled, isIOS, install } = useInstallPrompt()
  const user = useAuth((state) => state.user)
  const offline = useAuth((state) => state.offline)
  const logout = useAuth((state) => state.logout)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [confirmDemo, setConfirmDemo] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [pendingImport, setPendingImport] = useState<AppData | null>(null)

  const handleInstall = async () => {
    const outcome = await install()
    if (outcome === 'accepted') {
      toast('Bolsillo se instaló correctamente.')
    } else if (outcome === 'dismissed') {
      toast('Puedes instalar Bolsillo más tarde desde el menú del navegador.', 'info')
    }
  }

  const handleLogout = async () => {
    try {
      await saveCloudData(appDataFromStore(useStore.getState()))
    } catch {
      // El cierre de sesión local debe funcionar aunque no haya conexión.
    }
    await logout()
  }

  const themes: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Oscuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor },
  ]

  const handleExport = () => {
    const { wallets, categories, transactions, transfers, recurring, settings } =
      useStore.getState()
    const payload = {
      app: 'bolsillo',
      version: 2,
      exportedAt: new Date().toISOString(),
      data: { wallets, categories, transactions, transfers, recurring, settings },
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bolsillo-backup-${todayISO()}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    toast('Copia de seguridad descargada.')
  }

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const raw = parsed?.data ?? parsed
      if (
        !raw ||
        !Array.isArray(raw.wallets) ||
        !Array.isArray(raw.categories) ||
        !Array.isArray(raw.transactions) ||
        !Array.isArray(raw.recurring)
      ) {
        throw new Error('invalid')
      }
      const data: AppData = {
        wallets: raw.wallets.filter((item: any) => item && typeof item.id === 'string'),
        categories: raw.categories
          .filter((item: any) => item && typeof item.id === 'string')
          .map((item: any) => ({
            ...item,
            subcategories: Array.isArray(item.subcategories) ? item.subcategories : [],
          })),
        transactions: raw.transactions
          .filter((item: any) => item && typeof item.id === 'string')
          .map((item: any) => ({
            ...item,
            createdAt: item.createdAt ?? new Date().toISOString(),
          })),
        transfers: Array.isArray(raw.transfers)
          ? raw.transfers
              .filter((item: any) => item && typeof item.id === 'string')
              .map((item: any) => ({
                ...item,
                createdAt: item.createdAt ?? new Date().toISOString(),
              }))
          : [],
        recurring: raw.recurring.filter((item: any) => item && typeof item.id === 'string'),
        settings: {
          ...DEFAULT_SETTINGS,
          ...(raw.settings && typeof raw.settings === 'object' ? raw.settings : {}),
          theme: isTheme(raw.settings?.theme) ? raw.settings.theme : DEFAULT_SETTINGS.theme,
        },
      }
      setPendingImport(data)
    } catch {
      toast('El archivo no tiene un formato de copia válido.', 'error')
    }
  }

  const handleLoadDemo = () => {
    if (transactions.length > 0 || transfers.length > 0) {
      setConfirmDemo(true)
      return
    }
    loadDemo()
    toast('Datos de ejemplo cargados.')
  }

  return (
    <div className="page-wrap space-y-4">
      <PageHeader
        eyebrow="Configuración"
        title="Ajustes"
        subtitle="Personaliza la apariencia, la moneda y gestiona tus datos."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
              <Palette size={17} />
            </span>
            <div>
              <h2 className="section-title">Apariencia</h2>
              <p className="text-[11px] text-muted">Elige cómo se ve Bolsillo.</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {themes.map((theme) => {
              const active = settings.theme === theme.value
              return (
                <button
                  key={theme.value}
                  type="button"
                  onClick={() => setSettings({ theme: theme.value })}
                  className={cn(
                    'relative rounded-xl border p-2 text-left transition',
                    active
                      ? 'border-brand bg-brand-soft/50 ring-2 ring-brand/15'
                      : 'border-line bg-surface hover:border-line-strong',
                  )}
                >
                  <ThemeMini theme={theme.value} />
                  <span className="mt-2 flex items-center gap-1.5 text-[11.5px] font-medium text-fg">
                    <theme.icon size={13} />
                    {theme.label}
                  </span>
                  {active && (
                    <span className="absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-full bg-brand text-white">
                      <Check size={10} strokeWidth={3} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-[10.5px] text-faint">
            El modo sistema sigue la configuración de tu dispositivo.
          </p>
        </section>

        <section className="card p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-income-soft text-income">
              <Coins size={17} />
            </span>
            <div>
              <h2 className="section-title">Moneda</h2>
              <p className="text-[11px] text-muted">Formato usado en importes y estadísticas.</p>
            </div>
          </div>

          <div className="mt-4">
            <Select
              label="Moneda"
              value={settings.currency}
              onChange={(event) => {
                setSettings({ currency: event.target.value })
                toast('Moneda actualizada.')
              }}
            >
              {CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.label} ({currency.symbol})
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl border border-line bg-surface2/60 px-3.5 py-3">
            <span className="text-[11px] text-muted">Ejemplo de formato</span>
            <span className="text-[16px] font-semibold tnum text-fg">
              {formatMoney(1234.56, settings.currency)}
            </span>
          </div>
          <p className="mt-3 text-[10.5px] text-faint">
            Los importes se formatean con la configuración regional española (es-ES).
          </p>
        </section>
      </div>

      <section className="card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
              <Smartphone size={17} />
            </span>
            <div>
              <h2 className="section-title">Instalar en tu móvil</h2>
              <p className="text-[11px] text-muted">
                Úsala como una app, a pantalla completa y sin conexión.
              </p>
            </div>
          </div>
          {isInstalled && (
            <span className="inline-flex items-center gap-1.5 self-start rounded-lg bg-income-soft px-2 py-1 text-[10.5px] font-medium text-income">
              <CheckCircle2 size={12} />
              Instalada
            </span>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-line bg-surface2/60 p-3.5">
          {isInstalled ? (
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-income" />
              <p className="text-[12px] leading-relaxed text-muted">
                Bolsillo ya está instalada en este dispositivo. Ábrela desde su icono
                para usarla a pantalla completa y seguir consultando tus datos sin
                conexión.
              </p>
            </div>
          ) : canInstall ? (
            <>
              <p className="text-[12px] leading-relaxed text-muted">
                Añade Bolsillo a tu pantalla de inicio para abrirla directamente, sin
                la barra del navegador.
              </p>
              <Button size="sm" onClick={handleInstall} className="mt-3 w-full sm:w-auto">
                <Download size={14} />
                Instalar Bolsillo
              </Button>
            </>
          ) : isIOS ? (
            <>
              <p className="text-[12px] leading-relaxed text-muted">
                En iPhone o iPad, abre Bolsillo en Safari y toca{' '}
                <span className="inline-flex items-center gap-1 font-medium text-fg">
                  <Share2 size={13} />
                  Compartir
                </span>{' '}
                →{' '}
                <span className="font-medium text-fg">Añadir a pantalla de inicio</span>.
              </p>
              <p className="mt-1.5 text-[10.5px] leading-relaxed text-faint">
                Si usas otro navegador en iOS, también encontrarás esta opción en el
                menú Compartir.
              </p>
            </>
          ) : (
            <p className="text-[12px] leading-relaxed text-muted">
              Abre el menú del navegador y elige{' '}
              <span className="font-medium text-fg">Instalar aplicación</span> o{' '}
              <span className="font-medium text-fg">Añadir a pantalla de inicio</span>.
              En Chrome también puedes usar el icono de instalar de la barra de
              direcciones.
            </p>
          )}
        </div>

        <div className="mt-3 grid gap-2 text-[11px] text-muted sm:grid-cols-2">
          <span className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2">
            <Check size={13} className="shrink-0 text-income" />
            Acceso directo desde la pantalla de inicio
          </span>
          <span className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2">
            <WifiOff size={13} className="shrink-0 text-brand" />
            Funciona sin conexión
          </span>
        </div>
      </section>

      <section className="card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
              <UserRound size={17} />
            </span>
            <div>
              <h2 className="section-title">Cuenta</h2>
              <p className="text-[11px] text-muted">
                Sesión iniciada como{' '}
                <span className="font-medium text-fg">{user?.username ?? '—'}</span>.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10.5px] font-medium',
                offline ? 'bg-warn-soft text-warn' : 'bg-income-soft text-income',
              )}
            >
              {offline ? <CloudOff size={12} /> : <Cloud size={12} />}
              {offline ? 'Sin conexión' : 'En la nube'}
            </span>
            <Button variant="secondary" size="sm" onClick={() => void handleLogout()}>
              <LogOut size={14} />
              Cerrar sesión
            </Button>
          </div>
        </div>
        <p className="mt-3 text-[10.5px] leading-relaxed text-faint">
          Tus datos se guardan en PostgreSQL y se sincronizan automáticamente. En este
          dispositivo queda una copia local para poder consultarlos sin conexión.
        </p>
      </section>

      <section className="card p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-surface2 text-muted">
              <Database size={17} />
            </span>
            <div>
              <h2 className="section-title">Datos y respaldo</h2>
              <p className="text-[11px] text-muted">
                {transactions.length} movimientos · {transfers.length} transferencias ·{' '}
                {wallets.length} billeteras · {categories.length} categorías ·{' '}
                {recurring.length} fijos
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start rounded-lg bg-income-soft px-2 py-1 text-[10.5px] font-medium text-income sm:self-auto">
            <ShieldCheck size={12} />
            Guardado local
          </span>
        </div>

        <div className="mt-4 divide-y divide-line">
          <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[13px] font-medium text-fg">Exportar copia de seguridad</p>
              <p className="mt-0.5 text-[11.5px] text-muted">
                Descarga billeteras, categorías, movimientos, transferencias, fijos y
                ajustes en JSON.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download size={14} />
              Exportar
            </Button>
          </div>

          <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[13px] font-medium text-fg">Importar copia</p>
              <p className="mt-0.5 text-[11.5px] text-muted">
                Restaura un archivo exportado. Reemplaza todos los datos actuales.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFile}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} />
              Importar
            </Button>
          </div>

          <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[13px] font-medium text-fg">Cargar datos de ejemplo</p>
              <p className="mt-0.5 text-[11.5px] text-muted">
                Seis meses de movimientos y fijos para probar la aplicación.
              </p>
            </div>
            <Button variant="soft" size="sm" onClick={handleLoadDemo}>
              <Sparkles size={14} />
              Cargar ejemplo
            </Button>
          </div>

          <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[13px] font-medium text-expense">Restablecer todo</p>
              <p className="mt-0.5 text-[11.5px] text-muted">
                Elimina todos tus datos y vuelve a las categorías y billeteras iniciales.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-expense hover:bg-expense-soft hover:text-expense"
              onClick={() => setConfirmReset(true)}
            >
              <RotateCcw size={14} />
              Restablecer
            </Button>
          </div>
        </div>
      </section>

      <div className="flex flex-col items-center justify-center gap-2 py-4 text-center">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
          <ShieldCheck size={13} className="text-income" />
          Tus datos nunca salen de este navegador
        </span>
        <p className="text-[10.5px] text-faint">
          Bolsillo v1.0 · Hecho para tener tus finanzas en claro.
        </p>
      </div>

      <ConfirmDialog
        open={confirmDemo}
        onClose={() => setConfirmDemo(false)}
        onConfirm={() => {
          loadDemo()
          toast('Datos de ejemplo cargados.')
        }}
        title="Cargar datos de ejemplo"
        description="Se reemplazarán los movimientos, fijos, billeteras y categorías actuales por un conjunto de demostración de seis meses. Exporta una copia antes si quieres conservar tus datos."
        confirmLabel="Cargar ejemplo"
        danger={false}
        icon={
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
            <Sparkles size={18} />
          </span>
        }
      />

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          resetAll()
          toast('Todos los datos se restablecieron.')
        }}
        title="Restablecer todos los datos"
        description="Se eliminarán todas tus billeteras, categorías, movimientos y fijos. Esta acción no se puede deshacer. Te recomendamos exportar una copia antes."
        confirmLabel="Restablecer todo"
      />

      <ConfirmDialog
        open={Boolean(pendingImport)}
        onClose={() => setPendingImport(null)}
        onConfirm={() => {
          if (!pendingImport) return
          replaceData(pendingImport)
          toast('Copia importada correctamente.')
        }}
        title="Importar copia de seguridad"
        description="La importación reemplazará todos los datos actuales por los del archivo. Esta acción no se puede deshacer."
        confirmLabel="Importar datos"
        danger={false}
        icon={
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
            <Upload size={18} />
          </span>
        }
      />
    </div>
  )
}
