const states = {
  default:
    'border-[var(--gray-200)] focus:border-[var(--brand-400)] focus:ring-[var(--brand-100)]',
  error: 'animate-shake border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger-light)]',
  success:
    'border-[var(--success)] focus:border-[var(--success)] focus:ring-[var(--success-light)]',
}

export default function Input({
  className = '',
  error,
  label,
  name,
  state = 'default',
  success = false,
  textarea = false,
  ...props
}) {
  const Control = textarea ? 'textarea' : 'input'
  const visualState = error ? 'error' : success ? 'success' : state

  return (
    <label className={`grid gap-1.5 text-sm font-medium text-[var(--text-secondary)] ${className}`}>
      {label ? <span className="text-label">{label}</span> : null}
      <Control
        className={`min-h-11 w-full rounded-[var(--radius-md)] border bg-[color-mix(in_srgb,var(--surface-0)_94%,transparent)] px-4 py-2.5 text-sm text-[var(--text-primary)] shadow-[var(--shadow-xs)] outline-none transition-all placeholder:text-[var(--text-muted)] hover:border-[color-mix(in_srgb,var(--brand-300)_45%,var(--gray-200))] focus:bg-[var(--surface-0)] focus:ring-[3px] disabled:cursor-not-allowed disabled:bg-[var(--surface-2)] disabled:text-[var(--text-muted)] ${
          states[visualState] || states.default
        }`}
        name={name}
        rows={textarea ? 4 : undefined}
        {...props}
      />
      {error ? <span className="text-xs font-medium text-[var(--danger)]">{error}</span> : null}
    </label>
  )
}
