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
      className={`inline-flex min-h-11 overflow-hidden rounded-lg border border-gray-300 bg-white ${className}`}
      role="group"
    >
      {options.map((option) => (
        <button
          className={`min-h-11 px-3 text-sm font-bold transition ${
            selectedFontSize === option.value
              ? 'bg-indigo-600 text-white'
              : 'text-gray-700 hover:bg-gray-50'
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
