export default function Spinner({ className = 'h-4 w-4' }) {
  return (
    <span
      aria-hidden="true"
      className={`${className} inline-block animate-spin rounded-[var(--radius-full)] border-2 border-current border-t-transparent`}
      style={{ animationDuration: '600ms' }}
    />
  )
}
