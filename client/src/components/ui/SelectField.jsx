export default function SelectField({ children, className = '', error = '', label, name, ...props }) {
  return (
    <label className={`grid gap-1.5 text-sm font-medium text-[var(--text-secondary)] ${className}`}>
      {label ? <span className="text-label">{label}</span> : null}
      <select
        className={`min-h-11 w-full rounded-[var(--radius-md)] border bg-[color-mix(in_srgb,var(--surface-0)_94%,transparent)] px-4 py-2.5 text-sm text-[var(--text-primary)] shadow-[var(--shadow-xs)] outline-none transition-all hover:border-[color-mix(in_srgb,var(--brand-300)_45%,var(--gray-200))] focus:border-[var(--brand-400)] focus:bg-[var(--surface-0)] focus:ring-[3px] focus:ring-[var(--brand-100)] disabled:cursor-not-allowed disabled:bg-[var(--surface-2)] disabled:text-[var(--text-muted)] ${
          error ? 'animate-shake border-[var(--danger)] focus:ring-[var(--danger-light)]' : 'border-[var(--gray-200)]'
        }`}
        name={name}
        {...props}
      >
        {children}
      </select>
      {error ? <span className="text-xs font-medium text-[var(--danger)]">{error}</span> : null}
    </label>
  )
}
