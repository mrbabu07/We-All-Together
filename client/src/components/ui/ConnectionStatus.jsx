import { useEffect, useState } from 'react'

export default function ConnectionStatus() {
  const [online, setOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)

    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (online) {
    return null
  }

  return (
    <div className="fixed inset-x-0 top-0 z-[70] bg-red-600 px-4 py-2 text-center text-sm font-semibold text-white">
      সংযোগ নেই। শেষ cache করা তথ্য দেখা যেতে পারে।
    </div>
  )
}
