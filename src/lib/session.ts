import { appDataFromStore, clearCloudPending, saveCloudData } from './cloud'
import { useAuth } from '../store/useAuth'
import { useStore } from '../store/useStore'

/**
 * Guarda el estado actual en la nube (si es posible) y cierra la sesión.
 * El cierre local funciona aunque no haya conexión.
 */
export async function logoutWithSync() {
  const user = useAuth.getState().user
  if (user) {
    try {
      await saveCloudData(appDataFromStore(useStore.getState()))
      clearCloudPending(user.id)
    } catch {
      // El cierre de sesión local debe funcionar aunque no haya conexión.
    }
  }
  await useAuth.getState().logout()
}
