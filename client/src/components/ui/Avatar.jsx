export default function Avatar({ name = 'User', src, size = 'md' }) {
  const sizes = {
    sm: 'h-9 w-9 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-16 w-16 text-lg',
  }

  if (src) {
    return (
      <img
        alt={name}
        className={`${sizes[size]} rounded-full border border-gray-200 object-cover`}
        src={src}
      />
    )
  }

  return (
    <div
      className={`${sizes[size]} inline-flex items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700`}
    >
      {name?.slice(0, 1) || 'U'}
    </div>
  )
}
