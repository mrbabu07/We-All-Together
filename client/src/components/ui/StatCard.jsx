import { ArrowUpRight } from 'lucide-react'
import Card from './Card'

export default function StatCard({
  icon: Icon,
  label,
  tone = 'indigo',
  trend = '↑ 0%',
  value,
}) {
  const tones = {
    green: 'bg-green-100 text-green-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  }

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
          <p className="text-3xl font-bold tracking-tight text-gray-900">{value}</p>
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
