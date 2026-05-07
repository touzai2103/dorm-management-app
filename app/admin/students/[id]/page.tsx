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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminUids = (process.env.ADMIN_AUTH_UIDS ?? '')
    .split(',').map(s => s.trim()).filter(Boolean)
  if (!adminUids.includes(user.id)) redirect('/')

  const { id } = await params
  const admin = createAdminClient()

  const { data: student } = await admin
    .from('students')
    .select('id, name, furigana, phone, dormitory, enrollment_year, birth_date, room_number')
    .eq('id', id)
    .single()

  if (!student) notFound()

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
            <StudentEditForm student={student} />
          </div>
        </div>
      </div>
    </div>
  )
}
