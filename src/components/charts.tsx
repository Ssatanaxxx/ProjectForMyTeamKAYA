import type { ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTheme } from '../theme'
import { tengeShort, tenge } from '../lib/format'

// Палитра графиков — согласована со светлой/тёмной темой.
function usePalette() {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  return {
    brand: dark ? '#818cf8' : '#434cd6',
    brandSoft: dark ? '#3730a3' : '#c7ccf7',
    positive: dark ? '#34c788' : '#169560',
    warning: dark ? '#e0a84a' : '#c58418',
    danger: dark ? '#f07171' : '#d03c3c',
    grid: dark ? '#2a3142' : '#e2e6ed',
    axis: dark ? '#6e788c' : '#8c95a6',
    surface: dark ? '#151924' : '#ffffff',
    border: dark ? '#2a3142' : '#e2e6ed',
    ink: dark ? '#e9edf5' : '#111827',
    series: dark
      ? ['#818cf8', '#34c788', '#e0a84a', '#f07171', '#5eead4', '#c084fc']
      : ['#434cd6', '#169560', '#c58418', '#d03c3c', '#0d9488', '#7c3aed'],
  }
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 shadow-pop">
      {label && <p className="mb-1 text-xs font-semibold text-ink">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="nums flex items-center gap-2 text-[13px] text-muted">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          {p.name}: <span className="font-semibold text-ink">{tenge(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

/** План (лимит) против заявки по департаментам. */
export function PlanFactBar({
  data,
}: {
  data: Array<{ name: string; limit: number; requested: number }>
}) {
  const c = usePalette()
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barGap={6} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
        <XAxis dataKey="name" tick={{ fill: c.axis, fontSize: 12 }} tickLine={false} axisLine={{ stroke: c.grid }} />
        <YAxis
          tickFormatter={(v) => tengeShort(v).replace(' ₸', '')}
          tick={{ fill: c.axis, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={60}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: c.grid, opacity: 0.35 }} />
        <Legend wrapperStyle={{ fontSize: 12, color: c.axis }} />
        <Bar dataKey="limit" name="Лимит" fill={c.brandSoft} radius={[5, 5, 0, 0]} />
        <Bar dataKey="requested" name="Заявлено" radius={[5, 5, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.requested > d.limit ? c.danger : c.brand} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Доли департаментов в общей заявке. */
export function ShareDonut({ data }: { data: Array<{ name: string; value: number }> }) {
  const c = usePalette()
  const filled = data.filter((d) => d.value > 0)
  if (filled.length === 0) return <EmptyChart>Пока нет заявленных сумм</EmptyChart>

  // Recharts не может нарисовать ровно один сектор на 360° — вырожденная SVG-дуга.
  // Частый случай в начале работы (один департамент = 100%) рисуем отдельным кольцом.
  if (filled.length === 1) {
    return <SingleShareRing name={filled[0].name} color={c.series[0]} track={c.grid} />
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={filled}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={62}
          outerRadius={100}
          paddingAngle={2}
          stroke={c.surface}
          strokeWidth={2}
        >
          {filled.map((_, i) => (
            <Cell key={i} fill={c.series[i % c.series.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, color: c.axis }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

function SingleShareRing({ name, color, track }: { name: string; color: string; track: string }) {
  const r = 80
  const c = 2 * Math.PI * r
  return (
    <div className="flex h-[280px] flex-col items-center justify-center gap-4">
      <div className="relative h-[200px] w-[200px]">
        <svg width={200} height={200} viewBox="0 0 200 200" className="-rotate-90">
          <circle cx={100} cy={100} r={r} fill="none" stroke={track} strokeWidth={22} />
          <circle
            cx={100}
            cy={100}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={22}
            strokeDasharray={c}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="font-display text-2xl font-bold text-ink">100%</p>
        </div>
      </div>
      <span className="inline-flex items-center gap-1.5 text-sm text-muted">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        {name}
      </span>
    </div>
  )
}

export function EmptyChart({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-faint">
      {children}
    </div>
  )
}
