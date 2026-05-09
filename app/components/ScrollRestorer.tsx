'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ScrollRestorer() {
  const pathname = usePathname()

  // リンクをクリックした瞬間に現在のスクロール位置を保存（遷移前に確実に取得）
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a[href]')
      if (!anchor) return
      const href = anchor.getAttribute('href') ?? ''
      if (!href.startsWith('/') && !href.startsWith('#')) return
      sessionStorage.setItem(`scroll:${pathname}`, String(window.scrollY))
    }
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [pathname])

  // パス変更後、保存済みのスクロール位置を復元
  useEffect(() => {
    const saved = sessionStorage.getItem(`scroll:${pathname}`)
    if (!saved || saved === '0') return
    const timer = setTimeout(() => {
      window.scrollTo({ top: parseInt(saved), behavior: 'instant' })
    }, 300)
    return () => clearTimeout(timer)
  }, [pathname])

  return null
}
