export default function Field({ className = '', error = '', label, name, textarea = false, ...props }) {
  const Input = textarea ? 'textarea' : 'input'

  return (
    <label className={`grid gap-1.5 text-sm font-medium text-gray-700 ${className}`}>
      <span>{label}</span>
      <Input
        className={`min-h-11 w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-indigo-500 ${
          error ? 'animate-shake border-red-500 focus:ring-red-500' : 'border-gray-300'
        }`}
        name={name}
        rows={textarea ? 4 : undefined}
        {...props}
      />
      {error ? <span className="text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  )
}
