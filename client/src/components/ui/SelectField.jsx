export default function SelectField({ children, className = '', label, name, ...props }) {
  return (
    <label className={`grid gap-1.5 text-sm font-medium text-gray-700 ${className}`}>
      <span>{label}</span>
      <select
        className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-indigo-500"
        name={name}
        {...props}
      >
        {children}
      </select>
    </label>
  )
}
