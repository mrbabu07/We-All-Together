export default function Button({
  as: Component = 'button',
  children,
  className = '',
  icon: Icon,
  loading = false,
  type = 'button',
  variant = 'primary',
  ...props
}) {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }

  const isDisabled = loading || props.disabled
  const elementProps =
    Component === 'button'
      ? {
          disabled: isDisabled,
          type,
        }
      : {}

  return (
    <Component
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-70 ${variants[variant]} ${className}`}
      {...props}
      {...elementProps}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : Icon ? (
        <Icon aria-hidden="true" className="h-4 w-4" />
      ) : null}
      {children}
    </Component>
  )
}
