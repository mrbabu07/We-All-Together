export default function Field({ className = '', label, name, textarea = false, ...props }) {
  const Input = textarea ? 'textarea' : 'input'

  return (
    <label className={`grid gap-1.5 text-sm font-medium text-gray-700 ${className}`}>
      <span>{label}</span>
      <Input
        className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
        name={name}
        rows={textarea ? 4 : undefined}
        {...props}
      />
    </label>
  )
}
