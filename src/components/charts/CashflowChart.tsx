import { useId } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useIsDark } from '../../lib/useTheme'
import { formatCompact, formatMoney } from '../../lib/format'
import { TooltipCard } from './ChartKit'

export interface CashflowPoint {
  key: string
  label: string
  income: number
  expense: number
}

export function CashflowChart({
  data,
  currency,
  height = 260,
}: {
  data: CashflowPoint[]
  currency: string
  height?: number
}) {
  const isDark = useIsDark()
  const rawId = useId().replace(/:/g, '')
  const incomeColor = isDark ? '#34d399' : '#0d9f6e'
  const expenseColor = isDark ? '#fb7185' : '#e5484d'
  const axisColor = isDark ? '#64748b' : '#94a3b8'
  const gridColor = isDark ? 'rgba(148,163,184,0.14)' : 'rgba(100,116,139,0.15)'

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 6, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id={`income-${rawId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={incomeColor} stopOpacity={0.26} />
              <stop offset="95%" stopColor={incomeColor} stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`expense-${rawId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={expenseColor} stopOpacity={0.2} />
              <stop offset="95%" stopColor={expenseColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 7" vertical={false} stroke={gridColor} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: axisColor, fontWeight: 500 }}
            dy={6}
          />
          <YAxis
            width={54}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10.5, fill: axisColor }}
            tickFormatter={(value: number) => formatCompact(value)}
          />
          <Tooltip
            cursor={{ stroke: axisColor, strokeDasharray: '4 4', strokeOpacity: 0.5 }}
            content={({ active, payload, label }: any) => {
              if (!active || !payload?.length) return null
              const income = payload.find((item: any) => item.dataKey === 'income')?.value ?? 0
              const expense = payload.find((item: any) => item.dataKey === 'expense')?.value ?? 0
              const net = income - expense
              return (
                <TooltipCard
                  title={String(label)}
                  rows={[
                    { label: 'Ingresos', value: formatMoney(income, currency), color: incomeColor },
                    { label: 'Gastos', value: formatMoney(expense, currency), color: expenseColor },
                  ]}
                  footer={
                    <div className="flex items-center justify-between gap-3 text-[11px]">
                      <span className="text-muted">Balance</span>
                      <span
                        className={net >= 0 ? 'tnum font-semibold text-income' : 'tnum font-semibold text-expense'}
                      >
                        {formatMoney(net, currency)}
                      </span>
                    </div>
                  }
                />
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="income"
            name="Ingresos"
            stroke={incomeColor}
            strokeWidth={2.2}
            fill={`url(#income-${rawId})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: isDark ? '#0f131a' : '#fff' }}
          />
          <Area
            type="monotone"
            dataKey="expense"
            name="Gastos"
            stroke={expenseColor}
            strokeWidth={2.2}
            fill={`url(#expense-${rawId})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: isDark ? '#0f131a' : '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}


