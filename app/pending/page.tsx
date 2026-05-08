import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/actions/auth'

export default async function PendingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()
  const { data: pending } = await adminClient
    .from('pending_admins')
    .select('name')
    .eq('auth_uid', user.id)
    .single()

  if (!pending) redirect('/')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">申請受付中</h1>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            {pending.name} さんの申請を受け付けました。<br />
            管理者が承認するまでしばらくお待ちください。
          </p>
        </div>
        <form action={signOut} className="pt-2">
          <button
            type="submit"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ログアウト
          </button>
        </form>
      </div>
    </div>
  )
}
