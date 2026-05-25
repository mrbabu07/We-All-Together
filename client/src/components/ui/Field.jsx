export default function Field({ className = '', label, name, textarea = false, ...props }) {
  const Input = textarea ? 'textarea' : 'input'

  return (
    <label className={`grid gap-1.5 text-sm font-medium text-slate-700 ${className}`}>
      <span>{label}</span>
      <Input
        className="min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        name={name}
        {...props}
      />
    </label>
  )
}
