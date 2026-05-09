import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import StaffEditForm from './StaffEditForm'

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ auth_uid: string }>
}) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const [{ data: { user } }, { auth_uid }, { data: dbAdmins }] = await Promise.all([
    supabase.auth.getUser(),
    params,
    adminClient.from('admins').select('auth_uid, role'),
  ])
  if (!user) redirect('/login')

  const envAdminUids = (process.env.ADMIN_AUTH_UIDS ?? '')
    .split(',').map(s => s.trim()).filter(Boolean)
  const allAdminUids = [...new Set([...envAdminUids, ...(dbAdmins?.map(a => a.auth_uid) ?? [])])]
  if (!allAdminUids.includes(user.id)) redirect('/')

  const currentUserRole = envAdminUids.includes(user.id)
    ? 'admin'
    : (dbAdmins?.find(a => a.auth_uid === user.id)?.role ?? 'admin')
  const isCurrentUserViewer = currentUserRole === 'viewer'

  const { data: staff } = await adminClient
    .from('admins')
    .select('auth_uid, name, furigana, phone, role')
    .eq('auth_uid', auth_uid)
    .single()

  if (!staff || !staff.name) notFound()

  return (
    <div className="min-h-screen bg-gray-50 animate-page-in">
      <div className="max-w-lg mx-auto">
        <div className="p-4 space-y-4">
          <header className="bg-[#ebe7df] border-b border-[#d5cfc7] px-4 py-3 sticky top-4 z-10 flex items-center gap-3 shadow-sm rounded-xl">
            <Link href="/admin" className="flex items-center gap-1 text-gray-400 hover:text-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">一覧</span>
            </Link>
            <h1 className="text-base font-bold text-gray-900">{staff.name}</h1>
          </header>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <StaffEditForm
              staff={{
                auth_uid: staff.auth_uid,
                name: staff.name,
                furigana: staff.furigana ?? '',
                phone: staff.phone ?? '',
                role: staff.role as 'admin' | 'viewer',
              }}
              isViewer={isCurrentUserViewer}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
