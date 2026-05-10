import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import StudentEditForm from './StudentEditForm'
import AdminMealCalendar from '@/app/components/AdminMealCalendar'
import AdminChangeLog from '@/app/components/AdminChangeLog'

function getJSTToday(): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return jst.toISOString().split('T')[0]
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days))
  return date.toISOString().split('T')[0]
}

function calcGrade(enrollmentYear: number): number {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const month = jst.getUTCMonth() + 1
  const year = jst.getUTCFullYear()
  const academicYear = month >= 4 ? year : year - 1
  return academicYear - enrollmentYear + 1
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

  const [{ data: student }, { data: declarations }, { data: allStudents }, { data: changeLogs }] = await Promise.all([
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
    adminClient
      .from('students')
      .select('id, name, dormitory')
      .order('dormitory', { ascending: true })
      .order('enrollment_year', { ascending: true })
      .order('furigana', { ascending: true }),
    adminClient
      .from('meal_declarations')
      .select('date, breakfast, dinner, updated_by_name, updated_at')
      .eq('student_id', id)
      .not('updated_by_name', 'is', null)
      .order('date', { ascending: false }),
  ])

  if (!student) notFound()

  const declarationMap: Record<string, { breakfast: boolean; dinner: boolean }> = {}
  declarations?.forEach(d => {
    declarationMap[d.date] = { breakfast: d.breakfast ?? false, dinner: d.dinner ?? false }
  })

  const studentList = allStudents ?? []
  const currentIndex = studentList.findIndex(s => s.id === id)
  const prevStudent = currentIndex > 0 ? studentList[currentIndex - 1] : null
  const nextStudent = currentIndex < studentList.length - 1 ? studentList[currentIndex + 1] : null

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
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h1 className="text-base font-bold text-gray-900 truncate">{student.name}</h1>
              {(() => {
                const grade = calcGrade(student.enrollment_year)
                const color =
                  grade === 1 ? 'bg-blue-100 text-blue-700' :
                  grade === 2 ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                return (
                  <span className={`text-xs rounded-full px-2 py-0.5 font-medium shrink-0 ${color}`}>
                    {grade}年生
                  </span>
                )
              })()}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {prevStudent ? (
                <Link
                  href={`/admin/students/${prevStudent.id}`}
                  title={prevStudent.name}
                  className="flex items-center gap-1 text-gray-500 hover:text-gray-800 active:opacity-50 transition-all px-1.5 py-1 rounded-lg hover:bg-black/5 active:bg-black/10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs max-w-[4rem] truncate">{prevStudent.name}</span>
                </Link>
              ) : (
                <span className="px-1.5 py-1 w-8" />
              )}
              <span className="text-gray-300">|</span>
              {nextStudent ? (
                <Link
                  href={`/admin/students/${nextStudent.id}`}
                  title={nextStudent.name}
                  className="flex items-center gap-1 text-gray-500 hover:text-gray-800 active:opacity-50 transition-all px-1.5 py-1 rounded-lg hover:bg-black/5 active:bg-black/10"
                >
                  <span className="text-xs max-w-[4rem] truncate">{nextStudent.name}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                </Link>
              ) : (
                <span className="px-1.5 py-1 w-8" />
              )}
            </div>
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

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-700">代理変更履歴</span>
              <span className="text-xs text-gray-400 ml-2">管理者による変更のみ記録</span>
            </div>
            <AdminChangeLog logs={changeLogs ?? []} />
          </div>
        </div>
      </div>
    </div>
  )
}
