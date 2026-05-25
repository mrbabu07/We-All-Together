export default function Panel({ children, className = '' }) {
  return (
    <section
      className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      {children}
    </section>
  )
}
