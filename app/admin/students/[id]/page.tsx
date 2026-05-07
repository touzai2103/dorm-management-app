import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import StudentEditForm from './StudentEditForm'

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // getUser・params・adminsテーブル を並列取得
  const [{ data: { user } }, { id }, { data: dbAdmins }] = await Promise.all([
    supabase.auth.getUser(),
    params,
    adminClient.from('admins').select('auth_uid'),
  ])
  if (!user) redirect('/login')

  const envAdminUids = (process.env.ADMIN_AUTH_UIDS ?? '')
    .split(',').map(s => s.trim()).filter(Boolean)
  const dbAdminUids = dbAdmins?.map(a => a.auth_uid) ?? []
  const allAdminUids = [...new Set([...envAdminUids, ...dbAdminUids])]

  if (!allAdminUids.includes(user.id)) redirect('/')

  // 寮生情報 と authLink を並列取得
  const [{ data: student }, { data: authLink }] = await Promise.all([
    adminClient
      .from('students')
      .select('id, name, furigana, phone, dormitory, enrollment_year, birth_date, room_number')
      .eq('id', id)
      .single(),
    adminClient
      .from('student_auth_links')
      .select('auth_uid')
      .eq('student_id', id)
      .maybeSingle(),
  ])

  if (!student) notFound()

  const hasAuthLink = !!authLink
  // 取得済みの allAdminUids でローカル判定（追加DBクエリ不要）
  const isStudentAdmin = hasAuthLink ? allAdminUids.includes(authLink!.auth_uid) : false

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto">
        <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10 flex items-center gap-3">
          <Link href="/admin" className="text-blue-600 text-sm hover:text-blue-700">
            ← 一覧
          </Link>
          <h1 className="text-base font-bold text-gray-900">{student.name}</h1>
          <span className="text-xs text-gray-400 ml-auto">{student.dormitory}</span>
        </header>

        <div className="p-4">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <StudentEditForm
              student={student}
              hasAuthLink={hasAuthLink}
              isStudentAdmin={isStudentAdmin}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
