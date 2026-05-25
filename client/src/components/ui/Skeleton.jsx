export default function Skeleton({ rows = 3 }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          className="animate-shimmer relative h-16 overflow-hidden rounded-md border border-gray-200 bg-gray-100"
          key={index}
        />
      ))}
    </div>
  )
}
