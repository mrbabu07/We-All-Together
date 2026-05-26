const aliases = {
  approved: 'success',
  cancelled: 'danger',
  completed: 'success',
  default: 'default',
  going: 'success',
  maybe: 'warning',
  not_going: 'danger',
  pending: 'warning',
  planned: 'brand',
  rejected: 'danger',
  verified: 'success',
}

const variants = {
  brand: {
    bg: 'bg-[var(--brand-50)]',
    border: 'border-[var(--brand-200)]',
    dot: 'bg-[var(--brand-600)]',
    text: 'text-[var(--brand-700)]',
  },
  danger: {
    bg: 'bg-[var(--danger-light)]',
    border: 'border-[var(--danger)]',
    dot: 'bg-[var(--danger)]',
    text: 'text-[var(--danger-dark)]',
  },
  default: {
    bg: 'bg-[var(--surface-2)]',
    border: 'border-[var(--gray-200)]',
    dot: 'bg-[var(--gray-400)]',
    text: 'text-[var(--text-secondary)]',
  },
  info: {
    bg: 'bg-[var(--info-light)]',
    border: 'border-[var(--info)]',
    dot: 'bg-[var(--info)]',
    text: 'text-[var(--info-dark)]',
  },
  success: {
    bg: 'bg-[var(--success-light)]',
    border: 'border-[var(--success)]',
    dot: 'bg-[var(--success)]',
    text: 'text-[var(--success-dark)]',
  },
  warning: {
    bg: 'bg-[var(--warning-light)]',
    border: 'border-[var(--warning)]',
    dot: 'bg-[var(--warning)]',
    text: 'text-[var(--warning-dark)]',
  },
}

export default function Badge({
  children,
  className = '',
  dot = false,
  outline = false,
  value = 'default',
  variant,
}) {
  const selected = variants[variant || aliases[value] || value] || variants.default

  return (
    <span
      className={`badge-pop inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border px-2.5 py-0.5 text-xs font-medium ${
        outline ? `bg-transparent ${selected.border}` : `${selected.bg} border-transparent`
      } ${selected.text} ${className}`}
    >
      {dot ? <span className={`h-2 w-2 rounded-full ${selected.dot}`} /> : null}
      {children}
    </span>
  )
}
