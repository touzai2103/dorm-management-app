'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ScrollRestorer() {
  const pathname = usePathname()

  useEffect(() => {
    return () => {
      sessionStorage.setItem(`scroll:${pathname}`, String(window.scrollY))
    }
  }, [pathname])

  useEffect(() => {
    const saved = sessionStorage.getItem(`scroll:${pathname}`)
    if (!saved) return
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: parseInt(saved), behavior: 'instant' })
        sessionStorage.removeItem(`scroll:${pathname}`)
      })
    })
  }, [pathname])

  return null
}
