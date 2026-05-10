'use client'

import { useState, useEffect } from 'react'

function getJSTParts() {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return {
    hm: `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`,
    s: String(now.getUTCSeconds()).padStart(2, '0'),
  }
}

export default function JSTClock() {
  const [parts, setParts] = useState(getJSTParts)

  useEffect(() => {
    const id = setInterval(() => setParts(getJSTParts()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex items-center bg-gray-900 rounded-2xl px-3.5 py-1.5 shadow-md">
      <span className="font-mono text-xl font-bold tabular-nums tracking-tight text-white leading-none">
        {parts.hm}
      </span>
      <span className="font-mono text-sm font-bold tabular-nums text-gray-400 leading-none ml-0.5">
        :{parts.s}
      </span>
    </div>
  )
}
