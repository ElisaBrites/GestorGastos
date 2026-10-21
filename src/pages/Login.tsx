import { useState, type FormEvent } from 'react'
import { AlertCircle, LockKeyhole, UserPlus, Wallet } from 'lucide-react'
import { ApiError } from '../lib/api'
import { cn } from '../lib/utils'
import { useAuth } from '../store/useAuth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

type Mode = 'login' | 'register'

export function LoginPage() {
  const hasUsers = useAuth((state) => state.hasUsers)
  const login = useAuth((state) => state.login)
  const register = useAuth((state) => state.register)
  const [mode, setMode] = useState<Mode>(hasUsers ? 'login' : 'register')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const isRegister = mode === 'register'

  const changeMode = (next: Mode) => {
    setMode(next)
    setError(null)
    setPassword('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!username.trim()) {
      setError('Escribe un nombre de usuario.')
      return
    }
    if (!password) {
      setError('Escribe una contraseña.')
      return
    }

    setLoading(true)
    try {
      if (isRegister) await register(username.trim(), password)
      else await login(username.trim(), password)
    } catch (caught) {
      if (caught instanceof ApiError) setError(caught.message)
      else setError('No se pudo conectar con el servidor. Revisa tu conexión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-4 py-8">
      <div className="w-full max-w-[390px]">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="gradient-brand grid h-14 w-14 place-items-center rounded-[18px] text-white shadow-[0_16px_30px_-16px_rgba(99,85,242,0.9)]">
            <Wallet size={27} strokeWidth={2.2} />
          </span>
          <h1 className="mt-4 text-[27px] font-semibold tracking-[-0.04em] text-fg">
            Bolsillo
          </h1>
          <p className="mt-1.5 max-w-[300px] text-[12.5px] leading-relaxed text-muted">
            {hasUsers
              ? 'Entra con tu usuario o crea una cuenta nueva para empezar.'
              : 'Crea el primer usuario de Bolsillo para empezar.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-5 sm:p-6">
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-surface2 p-1">
            <button
              type="button"
              onClick={() => changeMode('login')}
              className={cn(
                'flex h-8 items-center justify-center gap-1.5 rounded-lg text-[11.5px] font-medium transition',
                !isRegister ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg',
              )}
            >
              <LockKeyhole size={13} />
              Entrar
            </button>
            <button
              type="button"
              onClick={() => changeMode('register')}
              className={cn(
                'flex h-8 items-center justify-center gap-1.5 rounded-lg text-[11.5px] font-medium transition',
                isRegister ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg',
              )}
            >
              <UserPlus size={13} />
              Crear cuenta
            </button>
          </div>

          <div className="mb-4 flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
              {isRegister ? <UserPlus size={17} /> : <LockKeyhole size={17} />}
            </span>
            <div>
              <h2 className="section-title">
                {isRegister ? 'Nueva cuenta' : 'Iniciar sesión'}
              </h2>
              <p className="mt-0.5 text-[11px] text-muted">
                {isRegister
                  ? 'Cada usuario tiene sus propios datos en PostgreSQL.'
                  : 'Tus datos se cargan desde PostgreSQL.'}
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            <Input
              label="Usuario"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              required
              minLength={3}
              maxLength={32}
              placeholder="tu_usuario"
            />
            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              required
              minLength={isRegister ? 8 : undefined}
              maxLength={72}
              placeholder={isRegister ? 'Mínimo 8 caracteres' : 'Tu contraseña'}
            />
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-expense/20 bg-expense-soft px-3 py-2.5 text-[11.5px] leading-relaxed text-expense">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" className="mt-5 w-full" disabled={loading}>
            {loading
              ? isRegister
                ? 'Creando cuenta…'
                : 'Entrando…'
              : isRegister
                ? 'Crear cuenta y entrar'
                : 'Entrar en Bolsillo'}
          </Button>

          {isRegister && (
            <p className="mt-3 text-center text-[10.5px] leading-relaxed text-faint">
              Usa al menos 8 caracteres. La cuenta se guarda en la base de datos.
            </p>
          )}
        </form>

        <p className="mt-5 text-center text-[10.5px] leading-relaxed text-faint">
          Tus datos se guardan en PostgreSQL y también en este dispositivo como copia
          local de respaldo.
        </p>
      </div>
    </div>
  )
}
