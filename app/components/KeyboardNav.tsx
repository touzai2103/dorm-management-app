'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  prevHref?: string
  nextHref?: string
}

export default function KeyboardNav({ prevHref, nextHref }: Props) {
  const router = useRouter()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return
      }
      if (e.key === 'ArrowLeft' && prevHref) router.push(prevHref)
      if (e.key === 'ArrowRight' && nextHref) router.push(nextHref)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [prevHref, nextHref, router])

  return null
}
