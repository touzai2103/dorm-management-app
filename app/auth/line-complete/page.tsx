'use client'

import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function LineComplete() {
  useEffect(() => {
    const supabase = createClient()
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')

    if (access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token }).then(() => {
        window.location.href = '/'
      })
    } else {
      window.location.href = '/login?error=line_complete_error'
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500 text-sm">ログイン処理中...</p>
    </div>
  )
}
