import { useEffect, useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import Card from './Card'
import Badge from './Badge'

const parseDisplayValue = (value) => {
  if (typeof value === 'number') {
    return { number: value, prefix: '', suffix: '' }
  }

  const text = String(value ?? '')
  const match = text.match(/-?[\d,.]+/)

  if (!match) {
    return { number: null, prefix: '', suffix: text }
  }

  return {
    number: Number(match[0].replaceAll(',', '')),
    prefix: text.slice(0, match.index),
    suffix: text.slice((match.index || 0) + match[0].length),
  }
}

const tones = {
  brand: ['bg-[var(--brand-50)] text-[var(--brand-600)]', 'bg-[var(--brand-600)]'],
  green: ['bg-[var(--success-light)] text-[var(--success)]', 'bg-[var(--success)]'],
  indigo: ['bg-[var(--brand-50)] text-[var(--brand-600)]', 'bg-[var(--brand-600)]'],
  red: ['bg-[var(--danger-light)] text-[var(--danger)]', 'bg-[var(--danger)]'],
  yellow: ['bg-[var(--warning-light)] text-[var(--warning)]', 'bg-[var(--warning)]'],
}

export default function StatCard({
  icon: Icon,
  label,
  tone = 'brand',
  trend = '↑ 0%',
  trendDirection = 'up',
  value,
}) {
  const parsed = useMemo(() => parseDisplayValue(value), [value])
  const [displayNumber, setDisplayNumber] = useState(parsed.number ?? 0)
  const [toneClasses, sparklineClass] = tones[tone] || tones.brand
  const TrendIcon = trendDirection === 'down' || String(trend).includes('↓') ? ArrowDownRight : ArrowUpRight
  const trendVariant = TrendIcon === ArrowDownRight ? 'danger' : 'success'

  useEffect(() => {
    if (parsed.number === null) {
      return undefined
    }

    const duration = 800
    const startedAt = performance.now()
    let frame = 0

    const tick = (time) => {
      const progress = Math.min((time - startedAt) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayNumber(Math.round(parsed.number * eased))

      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [parsed.number])

  const displayValue =
    parsed.number === null
      ? value
      : `${parsed.prefix}${displayNumber.toLocaleString('en-US')}${parsed.suffix}`

  return (
    <Card className="group p-6" hover>
      <div className="flex items-start justify-between gap-4">
        <span className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${toneClasses}`}>
          {Icon ? <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} /> : null}
        </span>
        <Badge dot value={trendVariant}>
          <TrendIcon aria-hidden="true" className="h-3 w-3" />
          {trend}
        </Badge>
      </div>

      <p className="mt-5 text-3xl font-bold tracking-tight text-[var(--text-primary)]">{displayValue}</p>
      <div className="mt-1 flex items-end justify-between gap-4">
        <p className="text-sm text-[var(--text-secondary)]">{label}</p>
        <span className="flex h-8 w-20 items-end gap-1 opacity-80">
          {[28, 46, 34, 62, 48, 70, 54].map((height, index) => (
            <span
              className={`w-full rounded-t ${sparklineClass} transition-all group-hover:opacity-100`}
              key={index}
              style={{ height: `${height}%`, opacity: 0.28 + index * 0.08 }}
            />
          ))}
        </span>
      </div>
    </Card>
  )
}
