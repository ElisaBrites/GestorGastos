import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import {
  appDataFromStore,
  getLegacyLocalData,
  loadUserData,
  saveUserData,
} from './userData'

export function useUserData(userId: string, enabled = true) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setReady(false)
      return
    }

    setReady(false)

    const stored = loadUserData(userId)
    const localData = stored ?? getLegacyLocalData()
    if (localData) useStore.getState().replaceData(localData)
    else useStore.getState().resetAll()

    const saveNow = () =>
      saveUserData(userId, appDataFromStore(useStore.getState()))

    saveNow()
    const unsubscribe = useStore.subscribe(saveNow)

    setReady(true)

    return () => {
      unsubscribe()
      saveNow()
    }
  }, [userId, enabled])

  return ready
}
