import { useState } from 'react'

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
  const [ripples, setRipples] = useState([])
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
  const handleClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const ripple = {
      id: Date.now(),
      size,
      x: event.clientX - rect.left - size / 2,
      y: event.clientY - rect.top - size / 2,
    }

    setRipples((current) => [...current.slice(-2), ripple])
    window.setTimeout(() => {
      setRipples((current) => current.filter((item) => item.id !== ripple.id))
    }, 520)
    props.onClick?.(event)
  }

  return (
    <Component
      className={`relative inline-flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-lg px-4 py-2 text-sm font-medium transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70 ${variants[variant]} ${className}`}
      {...props}
      onClick={handleClick}
      {...elementProps}
    >
      {ripples.map((ripple) => (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute animate-ripple rounded-full bg-current opacity-20"
          key={ripple.id}
          style={{
            height: ripple.size,
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
          }}
        />
      ))}
      {loading ? (
        <span
          aria-hidden="true"
          className="relative z-10 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : Icon ? (
        <Icon aria-hidden="true" className="relative z-10 h-4 w-4" />
      ) : null}
      <span className="relative z-10">{children}</span>
    </Component>
  )
}
