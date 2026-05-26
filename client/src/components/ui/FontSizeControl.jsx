import useTheme from '../../hooks/useTheme'

const options = [
  { label: 'A-', value: 'small' },
  { label: 'A', value: 'normal' },
  { label: 'A+', value: 'large' },
]

export default function FontSizeControl({ className = '' }) {
  const { selectedFontSize, setFontSizePreference } = useTheme()

  return (
    <div
      aria-label="ফন্ট সাইজ পরিবর্তন"
      className={`inline-flex min-h-10 overflow-hidden rounded-[var(--radius-md)] border border-[var(--gray-200)] bg-[var(--surface-0)] shadow-[var(--shadow-xs)] ${className}`}
      role="group"
    >
      {options.map((option) => (
        <button
          className={`min-h-10 px-3 text-sm font-bold transition-colors ${
            selectedFontSize === option.value
              ? 'bg-[var(--brand-600)] text-[var(--text-inverted)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
          }`}
          key={option.value}
          onClick={() => setFontSizePreference(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
