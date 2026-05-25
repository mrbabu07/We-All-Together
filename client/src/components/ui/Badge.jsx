const variants = {
  approved: 'bg-green-50 text-green-700 ring-green-200',
  completed: 'bg-green-50 text-green-700 ring-green-200',
  going: 'bg-green-50 text-green-700 ring-green-200',
  verified: 'bg-green-50 text-green-700 ring-green-200',
  pending: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
  maybe: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
  planned: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  rejected: 'bg-red-50 text-red-700 ring-red-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
  not_going: 'bg-red-50 text-red-700 ring-red-200',
  default: 'bg-gray-100 text-gray-700 ring-gray-200',
}

export default function Badge({ children, value = 'default' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${variants[value] || variants.default}`}
    >
      {children}
    </span>
  )
}
