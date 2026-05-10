'use client'

import { useState, useEffect } from 'react'

function getJSTTime() {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const h = String(now.getUTCHours()).padStart(2, '0')
  const m = String(now.getUTCMinutes()).padStart(2, '0')
  const s = String(now.getUTCSeconds()).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export default function JSTClock() {
  const [time, setTime] = useState(getJSTTime)

  useEffect(() => {
    const id = setInterval(() => setTime(getJSTTime()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="font-mono text-2xl font-bold text-gray-800 tabular-nums tracking-tight">
      {time}
    </span>
  )
}
