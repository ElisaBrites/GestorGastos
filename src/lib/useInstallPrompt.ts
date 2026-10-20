import { useEffect, useSyncExternalStore } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable'

function isStandaloneMode() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIOSDevice() {
  if (typeof navigator === 'undefined') return false
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || iPadOS
}

let promptEvent: BeforeInstallPromptEvent | null = null
let installed = isStandaloneMode()
let ios = isIOSDevice()
let started = false
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function start() {
  if (started || typeof window === 'undefined') return
  started = true
  ios = isIOSDevice()

  const onBeforeInstall = (event: Event) => {
    event.preventDefault()
    promptEvent = event as BeforeInstallPromptEvent
    emit()
  }
  const onInstalled = () => {
    installed = true
    promptEvent = null
    emit()
  }
  const displayMode = window.matchMedia('(display-mode: standalone)')
  const onDisplayModeChange = () => {
    installed = isStandaloneMode()
    emit()
  }

  window.addEventListener('beforeinstallprompt', onBeforeInstall)
  window.addEventListener('appinstalled', onInstalled)
  displayMode.addEventListener('change', onDisplayModeChange)
  emit()
}

async function install(): Promise<InstallOutcome> {
  const event = promptEvent
  if (!event) return 'unavailable'

  try {
    await event.prompt()
    const choice = await event.userChoice
    promptEvent = null

    if (choice.outcome === 'accepted') {
      installed = true
      emit()
      return 'accepted'
    }

    emit()
    return 'dismissed'
  } catch {
    promptEvent = null
    emit()
    return 'unavailable'
  }
}

if (typeof window !== 'undefined') start()

export function useInstallPrompt() {
  useEffect(() => {
    start()
  }, [])

  const promptAvailable = useSyncExternalStore(subscribe, () => Boolean(promptEvent))
  const isInstalled = useSyncExternalStore(subscribe, () => installed)
  const isIOS = useSyncExternalStore(subscribe, () => ios)

  return {
    canInstall: promptAvailable && !isInstalled,
    isInstalled,
    isIOS,
    install,
  }
}
