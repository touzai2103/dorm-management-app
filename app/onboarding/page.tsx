import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">はじめまして</h1>
          <p className="mt-2 text-sm text-gray-500">あなたの立場を選んでください</p>
        </div>
        <div className="space-y-3">
          <Link
            href="/register"
            className="block w-full bg-blue-600 text-white rounded-xl py-4 text-sm font-medium text-center hover:bg-blue-700 active:bg-blue-800 transition-colors"
          >
            寮生として登録する
          </Link>
          <Link
            href="/onboarding/staff"
            className="block w-full bg-white border border-gray-200 text-gray-700 rounded-xl py-4 text-sm font-medium text-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            寮のスタッフとして申請する
          </Link>
        </div>
      </div>
    </div>
  )
}
