import type { CSSProperties } from 'react'
import { Glyph } from '../../lib/icons'
import { hexToRgba } from '../../lib/utils'

export function CategoryIcon({
  icon,
  color,
  size = 40,
  className,
  radius,
}: {
  icon: string
  color: string
  size?: number
  className?: string
  radius?: number
}) {
  const style: CSSProperties = {
    width: size,
    height: size,
    backgroundColor: hexToRgba(color, 0.13),
    color,
    boxShadow: `inset 0 0 0 1px ${hexToRgba(color, 0.16)}`,
    borderRadius: radius ?? Math.round(size * 0.32),
  }
  return (
    <span
      className={`grid shrink-0 place-items-center ${className ?? ''}`}
      style={style}
      aria-hidden="true"
    >
      <Glyph name={icon} size={Math.round(size * 0.47)} strokeWidth={2.1} />
    </span>
  )
}
