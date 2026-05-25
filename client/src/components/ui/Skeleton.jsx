export default function Skeleton({ rows = 3 }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          className="h-16 animate-pulse rounded-md border border-slate-200 bg-slate-100"
          key={index}
        />
      ))}
    </div>
  )
}
