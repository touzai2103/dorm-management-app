import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import StaffRegisterForm from './StaffRegisterForm'

export default async function StaffRegisterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()
  const [{ data: authLink }, { data: pending }] = await Promise.all([
    supabase.from('student_auth_links').select('student_id').eq('auth_uid', user.id).maybeSingle(),
    adminClient.from('pending_admins').select('auth_uid').eq('auth_uid', user.id).maybeSingle(),
  ])

  if (authLink) redirect('/')
  if (pending) redirect('/pending')

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-sm mx-auto bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-1">
          <Link href="/onboarding" className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">スタッフ申請</h1>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          管理者が承認するまでアプリは利用できません。
        </p>
        <StaffRegisterForm />
      </div>
    </div>
  )
}
