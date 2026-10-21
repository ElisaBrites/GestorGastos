import { useEffect, useState, type ReactNode } from 'react'
import { AlertCircle, LoaderCircle, RefreshCw, Wallet } from 'lucide-react'
import { ApiError } from '../lib/api'
import {
  appDataFromStore,
  clearCloudPending,
  fetchCloudData,
  hasCloudPending,
  saveCloudData,
} from '../lib/cloud'
import { useUserData } from '../lib/useUserData'
import { hasLocalUserData } from '../lib/userData'
import { useAuth } from '../store/useAuth'
import { useStore } from '../store/useStore'
import { LoginPage } from '../pages/Login'
import { Button } from './ui/Button'

function AuthLoading({ label }: { label: string }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-4">
      <div className="flex flex-col items-center text-center">
        <span className="gradient-brand grid h-14 w-14 place-items-center rounded-[18px] text-white shadow-[0_16px_30px_-16px_rgba(99,85,242,0.9)]">
          <Wallet size={27} strokeWidth={2.2} />
        </span>
        <div className="mt-4 flex items-center gap-2 text-[12px] font-medium text-muted">
          <LoaderCircle size={14} className="animate-spin text-brand" />
          {label}
        </div>
      </div>
    </div>
  )
}

function AuthError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-4">
      <div className="card w-full max-w-[380px] p-6 text-center">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-expense-soft text-expense">
          <AlertCircle size={21} />
        </span>
        <h1 className="mt-4 text-[18px] font-semibold tracking-[-0.02em] text-fg">
          No se pudo iniciar Bolsillo
        </h1>
        <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{message}</p>
        <Button onClick={onRetry} className="mt-5 w-full">
          <RefreshCw size={14} />
          Reintentar
        </Button>
      </div>
    </div>
  )
}

function UserDataGate({ userId, children }: { userId: string; children: ReactNode }) {
  const offline = useAuth((state) => state.offline)
  const canUseOffline = !offline || hasLocalUserData(userId)
  const localReady = useUserData(userId, canUseOffline)
  const [cloudReady, setCloudReady] = useState(false)

  useEffect(() => {
    if (!localReady) return

    let cancelled = false
    setCloudReady(false)

    const load = async () => {
      if (useAuth.getState().offline) {
        if (!cancelled) setCloudReady(true)
        return
      }

      try {
        if (hasCloudPending(userId)) {
          await saveCloudData(appDataFromStore(useStore.getState()))
          clearCloudPending(userId)
          if (!cancelled) setCloudReady(true)
          return
        }

        const cloud = await fetchCloudData()
        if (cancelled) return

        if (cloud) {
          useStore.getState().replaceData(cloud)
        } else {
          await saveCloudData(appDataFromStore(useStore.getState()))
        }

        if (!cancelled) setCloudReady(true)
      } catch (caught) {
        if (cancelled) return

        if (caught instanceof ApiError && caught.status === 401) {
          await useAuth.getState().logout()
          return
        }

        // Si falla la red o el servidor, los datos locales siguen disponibles.
        useAuth.setState({ offline: true })
        setCloudReady(true)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [localReady, userId])

  if (!canUseOffline) {
    return (
      <AuthError
        message="No hay conexión y este usuario no tiene una copia local de sus datos. Conéctate a internet para cargarlos desde PostgreSQL."
        onRetry={() => void useAuth.getState().check()}
      />
    )
  }

  if (!localReady || !cloudReady) return <AuthLoading label="Cargando tus datos…" />
  return <>{children}</>
}

export function AuthGate({ children }: { children: ReactNode }) {
  const status = useAuth((state) => state.status)
  const user = useAuth((state) => state.user)
  const error = useAuth((state) => state.error)
  const check = useAuth((state) => state.check)

  useEffect(() => {
    void check()
  }, [check])

  if (status === 'checking') return <AuthLoading label="Comprobando sesión…" />
  if (status === 'error') {
    return <AuthError message={error ?? 'No se pudo conectar con el servidor.'} onRetry={check} />
  }
  if (status !== 'authenticated' || !user) return <LoginPage />

  return (
    <UserDataGate key={user.id} userId={user.id}>
      {children}
    </UserDataGate>
  )
}
