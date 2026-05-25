export default function Button({
  as: Component = 'button',
  children,
  className = '',
  icon: Icon,
  type = 'button',
  variant = 'primary',
  ...props
}) {
  const variants = {
    primary: 'bg-emerald-700 text-white hover:bg-emerald-800',
    secondary: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
    danger: 'bg-rose-700 text-white hover:bg-rose-800',
  }

  const elementProps =
    Component === 'button'
      ? {
          type,
        }
      : {}

  return (
    <Component
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${variants[variant]} ${className}`}
      {...elementProps}
      {...props}
    >
      {Icon ? <Icon aria-hidden="true" className="h-4 w-4" /> : null}
      {children}
    </Component>
  )
}
