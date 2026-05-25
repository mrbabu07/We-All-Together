const variants = {
  approved: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  completed: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  pending: 'bg-amber-50 text-amber-800 ring-amber-200',
  planned: 'bg-cyan-50 text-cyan-800 ring-cyan-200',
  rejected: 'bg-rose-50 text-rose-800 ring-rose-200',
  cancelled: 'bg-rose-50 text-rose-800 ring-rose-200',
  default: 'bg-slate-100 text-slate-700 ring-slate-200',
}

export default function Badge({ children, value = 'default' }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${variants[value] || variants.default}`}
    >
      {children}
    </span>
  )
}
