export default function Skeleton({ className = '', rows = 3, variant = 'default' }) {
  if (variant === 'dashboard') {
    return (
      <div className={`grid gap-6 ${className}`}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              className="skeleton-shimmer h-36 rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-[var(--surface-2)]"
              key={index}
            />
          ))}
        </div>
        <div className="skeleton-shimmer h-80 rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-[var(--surface-2)]" />
      </div>
    )
  }

  if (variant === 'table') {
    return (
      <div className={`overflow-hidden rounded-[var(--radius-lg)] border border-[var(--gray-200)] ${className}`}>
        <div className="grid grid-cols-4 gap-4 bg-[var(--surface-1)] p-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="skeleton-shimmer h-4 rounded bg-[var(--surface-3)]" key={index} />
          ))}
        </div>
        <div className="grid gap-0">
          {Array.from({ length: rows }).map((_, index) => (
            <div className="grid grid-cols-4 gap-4 border-t border-[var(--gray-200)] p-4" key={index}>
              {Array.from({ length: 4 }).map((__, cellIndex) => (
                <div className="skeleton-shimmer h-5 rounded bg-[var(--surface-2)]" key={cellIndex} />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`grid gap-3 ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          className="skeleton-shimmer h-16 overflow-hidden rounded-[var(--radius-md)] border border-[var(--gray-200)] bg-[var(--surface-2)]"
          key={index}
        />
      ))}
    </div>
  )
}
