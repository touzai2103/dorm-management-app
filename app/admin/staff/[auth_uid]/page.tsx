import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import StaffEditForm from './StaffEditForm'
import StaffChangeLog from '@/app/components/StaffChangeLog'

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
    adminClient.from('admins').select('auth_uid, name, furigana, role'),
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

  const [{ data: staff }, { data: changeLogs }] = await Promise.all([
    adminClient
      .from('admins')
      .select('auth_uid, name, furigana, phone, role')
      .eq('auth_uid', auth_uid)
      .single(),
    adminClient
      .from('meal_change_logs')
      .select('id, date, meal, changed_to, changed_at, students(name)')
      .eq('changed_by_auth_uid', auth_uid)
      .order('changed_at', { ascending: false })
      .limit(50),
  ])

  if (!staff || !staff.name) notFound()

  const staffList = (dbAdmins ?? [])
    .filter(a => !envAdminUids.includes(a.auth_uid) && a.name)
    .sort((a, b) => {
      if (a.role !== b.role) return a.role === 'admin' ? -1 : 1
      return (a.furigana ?? '').localeCompare(b.furigana ?? '', 'ja')
    })
  const currentIndex = staffList.findIndex(a => a.auth_uid === auth_uid)
  const prevStaff = currentIndex > 0 ? staffList[currentIndex - 1] : null
  const nextStaff = currentIndex < staffList.length - 1 ? staffList[currentIndex + 1] : null

  return (
    <div className="min-h-screen bg-gray-50 animate-page-in">
      <div className="max-w-lg mx-auto">
        <div className="p-4 space-y-4">
          <header className="bg-[#ebe7df] border-b border-[#d5cfc7] px-4 py-3 sticky top-4 z-10 flex items-center gap-3 shadow-sm rounded-xl">
            <Link href="/admin" scroll={false} className="flex items-center gap-1 text-gray-400 hover:text-gray-700 active:opacity-50 transition-all shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">一覧</span>
            </Link>
            <h1 className="text-base font-bold text-gray-900 flex-1 truncate">{staff.name}</h1>
            <div className="flex items-center gap-1.5 shrink-0">
              {prevStaff ? (
                <Link
                  href={`/admin/staff/${prevStaff.auth_uid}`}
                  title={prevStaff.name ?? ''}
                  className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300 active:bg-gray-400 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                  </svg>
                </Link>
              ) : (
                <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-300">
                    <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
              {nextStaff ? (
                <Link
                  href={`/admin/staff/${nextStaff.auth_uid}`}
                  title={nextStaff.name ?? ''}
                  className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300 active:bg-gray-400 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                </Link>
              ) : (
                <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-300">
                    <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </div>
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

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-700">代理変更履歴</span>
              <span className="text-xs text-gray-400 ml-2">直近50件</span>
            </div>
            <StaffChangeLog logs={changeLogs ?? []} />
          </div>
        </div>
      </div>
    </div>
  )
}
