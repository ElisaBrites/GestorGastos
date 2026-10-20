import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { useIsDark } from '../../lib/useTheme'
import { formatMoney, formatPercent } from '../../lib/format'
import { TooltipCard } from './ChartKit'

export interface DonutSlice {
  id: string
  name: string
  value: number
  color: string
}

export function CategoryDonut({
  data,
  total,
  currency,
  height = 220,
  centerLabel = 'Total',
  activeId,
  onSelect,
}: {
  data: DonutSlice[]
  total: number
  currency: string
  height?: number
  centerLabel?: string
  activeId?: string
  onSelect?: (id: string) => void
}) {
  const isDark = useIsDark()

  if (data.length === 0) {
    return (
      <div className="relative flex items-center justify-center" style={{ height }}>
        <div className="absolute h-[168px] w-[168px] rounded-full border-[22px] border-surface2" />
        <div className="relative z-10 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
            {centerLabel}
          </p>
          <p className="mt-1 text-lg font-semibold tnum">{formatMoney(0, currency)}</p>
          <p className="mt-1 text-[11px] text-faint">Sin datos en el periodo</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="69%"
            outerRadius="94%"
            paddingAngle={2}
            stroke="none"
            onClick={(entry: any) => {
              const id = entry?.id ?? entry?.payload?.id
              if (id && onSelect) onSelect(id)
            }}
            className={onSelect ? 'cursor-pointer' : undefined}
          >
            {data.map((slice) => (
              <Cell
                key={slice.id}
                fill={slice.color}
                fillOpacity={!activeId || activeId === slice.id ? 1 : 0.28}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }: any) => {
              if (!active || !payload?.length) return null
              const slice = payload[0]
              const value = Number(slice.value) || 0
              return (
                <TooltipCard
                  title={String(slice.name)}
                  rows={[
                    {
                      label: 'Importe',
                      value: formatMoney(value, currency),
                      color: slice.payload?.color,
                    },
                    {
                      label: 'Del total',
                      value: formatPercent(total ? (value / total) * 100 : 0, 1),
                    },
                  ]}
                />
              )
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
          {centerLabel}
        </p>
        <p
          className="mt-1 max-w-[55%] text-center text-[17px] font-semibold leading-tight tnum"
          style={{ color: isDark ? '#eef2f7' : '#0f172a' }}
        >
          {formatMoney(total, currency)}
        </p>
      </div>
    </div>
  )
}
