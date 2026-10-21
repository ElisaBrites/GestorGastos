import { useEffect } from 'react'
import { ApiError } from './api'
import { useAuth } from '../store/useAuth'
import { useStore } from '../store/useStore'
import {
  appDataFromStore,
  clearCloudPending,
  markCloudPending,
  saveCloudData,
} from './cloud'

export function useCloudSync() {
  useEffect(() => {
    const userId = useAuth.getState().user?.id
    if (!userId) return

    let disposed = false
    let saving = false
    let pending = false
    let timer: number | undefined
    let lastSaved = JSON.stringify(appDataFromStore(useStore.getState()))

    const flush = async () => {
      if (disposed) return
      if (saving) {
        pending = true
        return
      }

      const serialized = JSON.stringify(appDataFromStore(useStore.getState()))
      if (serialized === lastSaved) {
        clearCloudPending(userId)
        return
      }

      saving = true
      try {
        await saveCloudData(JSON.parse(serialized) as ReturnType<typeof appDataFromStore>)
        lastSaved = serialized
        const current = JSON.stringify(appDataFromStore(useStore.getState()))
        if (current === serialized) clearCloudPending(userId)
        if (useAuth.getState().offline) useAuth.setState({ offline: false })
      } catch (caught) {
        markCloudPending(userId)
        if (caught instanceof ApiError && caught.status === 401) {
          disposed = true
          await useAuth.getState().logout()
          return
        }
        // Keep the local copy and try again on the next change or when the connection returns.
      } finally {
        saving = false
        if (pending && !disposed) {
          pending = false
          void flush()
        }
      }
    }

    const schedule = () => {
      if (disposed) return
      markCloudPending(userId)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => void flush(), 900)
    }

    const onOnline = () => void flush()
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') void flush()
    }

    const unsubscribe = useStore.subscribe(schedule)
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      disposed = true
      window.clearTimeout(timer)
      unsubscribe()
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])
}
