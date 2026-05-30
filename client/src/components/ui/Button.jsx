import { useState } from 'react'
import Spinner from './Spinner'

const variants = {
  danger:
    'bg-[var(--danger)] text-[var(--text-inverted)] shadow-[var(--shadow-sm-token)] hover:bg-[var(--danger-dark)]',
  ghost:
    'bg-transparent text-[var(--brand-700)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-900)]',
  primary:
    'bg-[linear-gradient(135deg,var(--brand-600),var(--brand-800))] text-[var(--text-inverted)] shadow-[var(--shadow-brand)] hover:brightness-105 hover:shadow-[var(--shadow-lg-token)]',
  secondary:
    'border border-[color-mix(in_srgb,var(--gray-200)_78%,transparent)] bg-[color-mix(in_srgb,var(--surface-0)_92%,transparent)] text-[var(--text-primary)] shadow-[var(--shadow-xs)] backdrop-blur hover:border-[color-mix(in_srgb,var(--brand-300)_50%,var(--gray-200))] hover:bg-[var(--surface-0)]',
  success:
    'bg-[var(--success)] text-[var(--text-inverted)] shadow-[var(--shadow-sm-token)] hover:bg-[var(--success-dark)]',
}

const sizes = {
  lg: 'min-h-12 px-5 py-3 text-base',
  md: 'min-h-10 px-4 py-2 text-sm',
  sm: 'min-h-8 px-3 py-1.5 text-xs',
}

const iconSizes = {
  lg: 'h-5 w-5',
  md: 'h-4 w-4',
  sm: 'h-3.5 w-3.5',
}

export default function Button({
  as: Component = 'button',
  children,
  className = '',
  icon: LeftIcon,
  iconOnly = false,
  loading = false,
  rightIcon: RightIcon,
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...props
}) {
  const [ripples, setRipples] = useState([])
  const isDisabled = Boolean(loading || props.disabled)
  const selectedSize = sizes[size] || sizes.md
  const selectedIconSize = iconSizes[size] || iconSizes.md

  const elementProps =
    Component === 'button'
      ? {
          disabled: isDisabled,
          type,
        }
      : {
          'aria-disabled': isDisabled || undefined,
        }

  const handleClick = (event) => {
    if (isDisabled) {
      event.preventDefault()
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const rippleSize = Math.max(rect.width, rect.height)
    const ripple = {
      id: `${Date.now()}-${Math.random()}`,
      size: rippleSize,
      x: event.clientX - rect.left - rippleSize / 2,
      y: event.clientY - rect.top - rippleSize / 2,
    }

    setRipples((current) => [...current.slice(-2), ripple])
    window.setTimeout(() => {
      setRipples((current) => current.filter((item) => item.id !== ripple.id))
    }, 520)
    props.onClick?.(event)
  }

  return (
    <Component
      className={`relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden rounded-[var(--radius-md)] font-semibold transition-all duration-150 ease-out hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 ${
        variants[variant] || variants.primary
      } ${selectedSize} ${iconOnly ? 'aspect-square px-0' : ''} ${className}`}
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
        <Spinner className={`${selectedIconSize} relative z-10`} />
      ) : LeftIcon ? (
        <LeftIcon aria-hidden="true" className={`${selectedIconSize} relative z-10 shrink-0`} />
      ) : null}
      {iconOnly ? (
        <span className="sr-only">{children}</span>
      ) : (
        <span className={loading ? 'relative z-10 opacity-0' : 'relative z-10'}>{children}</span>
      )}
      {!loading && RightIcon ? (
        <RightIcon aria-hidden="true" className={`${selectedIconSize} relative z-10 shrink-0`} />
      ) : null}
    </Component>
  )
}
