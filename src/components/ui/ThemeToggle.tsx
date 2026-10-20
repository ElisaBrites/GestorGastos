import { Moon, Sun } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useIsDark } from '../../lib/useTheme'
import { cn } from '../../lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const isDark = useIsDark()
  const setSettings = useStore((state) => state.setSettings)

  return (
    <button
      type="button"
      onClick={() => setSettings({ theme: isDark ? 'light' : 'dark' })}
      className={cn('icon-btn', className)}
      title={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}
