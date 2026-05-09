'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ScrollRestorer() {
  const pathname = usePathname()

  // スクロールするたびに現在のパスの位置を保存
  useEffect(() => {
    const key = `scroll:${pathname}`
    const handleScroll = () => {
      sessionStorage.setItem(key, String(window.scrollY))
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [pathname])

  // パスが変わったとき（=ページ遷移後）に保存済み位置を復元
  useEffect(() => {
    const saved = sessionStorage.getItem(`scroll:${pathname}`)
    if (!saved || saved === '0') return
    const timer = setTimeout(() => {
      window.scrollTo({ top: parseInt(saved), behavior: 'instant' })
    }, 100)
    return () => clearTimeout(timer)
  }, [pathname])

  return null
}
