import { useState } from 'react'

const sizes = {
  '2xl': 'h-20 w-20 text-2xl',
  lg: 'h-12 w-12 text-base',
  md: 'h-10 w-10 text-sm',
  sm: 'h-8 w-8 text-xs',
  xl: 'h-16 w-16 text-xl',
  xs: 'h-6 w-6 text-[10px]',
}

const statusColors = {
  away: 'bg-[var(--warning)]',
  offline: 'bg-[var(--gray-400)]',
  online: 'bg-[var(--success)]',
}

const gradients = [
  'from-[var(--brand-500)] to-[var(--brand-700)]',
  'from-[var(--info)] to-[var(--brand-700)]',
  'from-[var(--success)] to-[var(--brand-600)]',
  'from-[var(--warning)] to-[var(--brand-600)]',
  'from-[var(--danger)] to-[var(--brand-700)]',
  'from-[var(--brand-400)] to-[var(--info)]',
  'from-[var(--success)] to-[var(--success-dark)]',
  'from-[var(--brand-700)] to-[var(--brand-900)]',
]

const getInitials = (name = 'User') =>
  String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U'

const hashName = (name = '') =>
  String(name)
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0)

export default function Avatar({
  className = '',
  name = 'User',
  ring = false,
  size = 'md',
  src,
  status = '',
}) {
  const [failedSrc, setFailedSrc] = useState('')
  const selectedSize = sizes[size] || sizes.md
  const gradient = gradients[hashName(name) % gradients.length]
  const showImage = Boolean(src) && failedSrc !== src

  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      {showImage ? (
        <img
          alt={name}
          className={`${selectedSize} rounded-[var(--radius-full)] border-2 border-[var(--surface-0)] object-cover ${
            ring ? 'ring-2 ring-[var(--brand-500)]' : ''
          }`}
          onError={() => setFailedSrc(src)}
          src={src}
        />
      ) : (
        <span
          className={`${selectedSize} inline-flex items-center justify-center rounded-[var(--radius-full)] bg-gradient-to-br ${gradient} font-semibold text-[var(--text-inverted)] ${
            ring ? 'ring-2 ring-[var(--brand-500)] ring-offset-2 ring-offset-[var(--surface-0)]' : ''
          }`}
        >
          {getInitials(name)}
        </span>
      )}
      {status ? (
        <span
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-[var(--radius-full)] border-2 border-[var(--surface-0)] ${
            statusColors[status] || statusColors.offline
          }`}
        />
      ) : null}
    </span>
  )
}
