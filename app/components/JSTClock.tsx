'use client'

import { useState, useEffect } from 'react'

function getJSTString() {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const hh = String(now.getUTCHours()).padStart(2, '0')
  const mm = String(now.getUTCMinutes()).padStart(2, '0')
  const ss = String(now.getUTCSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

export default function JSTClock() {
  const [text, setText] = useState(getJSTString)

  useEffect(() => {
    const id = setInterval(() => setText(getJSTString()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="shrink-0 flex flex-col items-end gap-0.5">
      <span className="text-[10px] font-medium text-blue-400 tracking-wide">現在時刻</span>
      <span className="font-mono text-2xl font-bold text-blue-900 tabular-nums tracking-wide">{text}</span>
    </div>
  )
}
