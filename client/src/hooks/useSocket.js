import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import useAuth from './useAuth'

const socketUrl =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1').replace(/\/api\/v1$/, '')

export default function useSocket(enabled = true) {
  const { token } = useAuth()
  const [online, setOnline] = useState({ count: 0, users: [] })

  useEffect(() => {
    if (!enabled || !token) {
      return undefined
    }

    const nextSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    nextSocket.on('presence:update', (snapshot) => {
      setOnline(snapshot || { count: 0, users: [] })
    })

    return () => {
      nextSocket.disconnect()
    }
  }, [enabled, token])

  return { online }
}
