import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import Card from './Card'

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

export default function StatCard({
  icon: Icon,
  label,
  tone = 'indigo',
  trend = '↑ 0%',
  value,
}) {
  const parsed = useMemo(() => parseDisplayValue(value), [value])
  const [displayNumber, setDisplayNumber] = useState(parsed.number ?? 0)
  const tones = {
    green: 'bg-green-100 text-green-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  }

  useEffect(() => {
    if (parsed.number === null) {
      return undefined
    }

    const duration = 1200
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
    <Card className="p-6">
      <div className="flex items-center justify-between gap-4">
        <div
          className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${
            tones[tone] || tones.indigo
          }`}
        >
          {Icon ? <Icon aria-hidden="true" className="h-5 w-5" /> : null}
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold tracking-tight text-gray-900">{displayValue}</p>
          <p className="mt-1 text-sm text-gray-500">{label}</p>
        </div>
      </div>
      <p className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-green-600">
        <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
        {trend}
      </p>
    </Card>
  )
}
