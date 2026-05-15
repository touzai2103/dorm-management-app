'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const SmartphoneIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path d="M8 16.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z" />
    <path fillRule="evenodd" d="M4 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Zm2-.5a.5.5 0 0 0-.5.5v12a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5V4a.5.5 0 0 0-.5-.5H6Z" clipRule="evenodd" />
  </svg>
)

export default function AddToHomeButton({ variant = 'admin' }: { variant?: 'admin' | 'student' }) {
  const router = useRouter()
  const promptRef = useRef<Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> } | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)

    const handler = (e: Event) => {
      e.preventDefault()
      promptRef.current = e as typeof promptRef.current
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (isStandalone) return null

  const handleClick = async () => {
    if (promptRef.current) {
      await promptRef.current.prompt()
      promptRef.current = null
    } else {
      router.push('/install')
    }
  }

  if (variant === 'student') {
    return (
      <button
        onClick={handleClick}
        className="shrink-0 flex items-center gap-1 text-xs text-gray-600 border border-gray-400 rounded-full px-3 py-1.5 hover:border-gray-600 hover:text-gray-800 hover:bg-gray-100 active:scale-95 active:bg-gray-200 transition-all"
      >
        <SmartphoneIcon className="w-3.5 h-3.5" />
        ホーム画面に追加
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1 text-xs text-gray-600 border border-gray-400 rounded-full px-3 py-1.5 hover:border-gray-600 hover:text-gray-800 hover:bg-gray-100 active:scale-95 active:bg-gray-200 transition-all"
    >
      <SmartphoneIcon className="w-3.5 h-3.5" />
      ホーム画面に追加
    </button>
  )
}
