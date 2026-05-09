import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import StudentEditForm from './StudentEditForm'
import AdminMealCalendar from '@/app/components/AdminMealCalendar'

function getJSTToday(): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return jst.toISOString().split('T')[0]
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days))
  return date.toISOString().split('T')[0]
}

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const [{ data: { user } }, { id }, { data: dbAdmins }] = await Promise.all([
    supabase.auth.getUser(),
    params,
    adminClient.from('admins').select('auth_uid, role'),
  ])
  if (!user) redirect('/login')

  const envAdminUids = (process.env.ADMIN_AUTH_UIDS ?? '')
    .split(',').map(s => s.trim()).filter(Boolean)
  const dbAdminUids = dbAdmins?.map(a => a.auth_uid) ?? []
  const allAdminUids = [...new Set([...envAdminUids, ...dbAdminUids])]

  if (!allAdminUids.includes(user.id)) redirect('/')

  const currentUserRole = envAdminUids.includes(user.id)
    ? 'admin'
    : (dbAdmins?.find(a => a.auth_uid === user.id)?.role ?? 'admin')
  const isCurrentUserViewer = currentUserRole === 'viewer'

  const today = getJSTToday()
  const endDate = addDays(today, 14)

  const [{ data: student }, { data: declarations }] = await Promise.all([
    adminClient
      .from('students')
      .select('id, name, furigana, phone, dormitory, enrollment_year, club, room_number')
      .eq('id', id)
      .single(),
    adminClient
      .from('meal_declarations')
      .select('date, breakfast, dinner')
      .eq('student_id', id)
      .gte('date', today)
      .lte('date', endDate),
  ])

  if (!student) notFound()

  const declarationMap: Record<string, { breakfast: boolean; dinner: boolean }> = {}
  declarations?.forEach(d => {
    declarationMap[d.date] = { breakfast: d.breakfast ?? false, dinner: d.dinner ?? false }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto">
        <div className="p-4 space-y-4">
          <header className="bg-[#ebe7df] border-b border-[#d5cfc7] px-4 py-3 sticky top-4 z-10 flex items-center gap-3 shadow-sm rounded-xl">
            <Link href="/admin" className="flex items-center gap-1 text-gray-400 hover:text-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">一覧</span>
            </Link>
            <h1 className="text-base font-bold text-gray-900">{student.name}</h1>
          </header>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <StudentEditForm
              student={student}
              isViewer={isCurrentUserViewer}
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-700">食事申告（代理変更）</span>
              <span className="text-xs text-gray-400 ml-2">締切済みの日付も変更できます</span>
            </div>
            <AdminMealCalendar
              studentId={student.id}
              declarations={declarationMap}
              today={today}
              readOnly={isCurrentUserViewer}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
