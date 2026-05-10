import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import MealCalendar from '@/app/components/MealCalendar'
import JSTClock from '@/app/components/JSTClock'

function getJSTToday(): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return jst.toISOString().split('T')[0]
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days))
  return date.toISOString().split('T')[0]
}

export default async function Home() {
  const adminClient = createAdminClient()
  let studentId: string

  // 開発プレビュー用バイパス（.env.local の DEV_PREVIEW_STUDENT_ID が設定されている場合のみ）
  const devStudentId = process.env.NODE_ENV === 'development'
    ? process.env.DEV_PREVIEW_STUDENT_ID
    : undefined

  if (devStudentId) {
    studentId = devStudentId
  } else {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const envAdminUids = (process.env.ADMIN_AUTH_UIDS ?? '')
      .split(',').map(s => s.trim()).filter(Boolean)
    if (envAdminUids.includes(user.id)) redirect('/admin')

    const [{ data: adminRecord }, { data: authLink }, { data: pendingAdmin }] = await Promise.all([
      adminClient.from('admins').select('auth_uid').eq('auth_uid', user.id).maybeSingle(),
      supabase.from('student_auth_links').select('student_id').eq('auth_uid', user.id).single(),
      adminClient.from('pending_admins').select('auth_uid').eq('auth_uid', user.id).maybeSingle(),
    ])

    if (adminRecord) redirect('/admin')
    if (!authLink) {
      if (pendingAdmin) redirect('/pending')
      redirect('/onboarding')
    }

    studentId = authLink.student_id
  }

  const today = getJSTToday()
  const endDate = addDays(today, 14)

  const [{ data: student }, { data: declarations }] = await Promise.all([
    adminClient.from('students').select('name, dormitory').eq('id', studentId).single(),
    adminClient.from('meal_declarations').select('date, breakfast, dinner')
      .eq('student_id', studentId)
      .gte('date', today)
      .lte('date', endDate),
  ])

  const declarationMap: Record<string, { breakfast: boolean; dinner: boolean }> = {}
  declarations?.forEach(d => {
    declarationMap[d.date] = {
      breakfast: d.breakfast ?? false,
      dinner: d.dinner ?? false,
    }
  })

  return (
    <div className="min-h-screen bg-gray-50 animate-page-in">
      <div className="max-w-lg mx-auto">
        <header className="bg-[#ebe7df] border-b border-[#d5cfc7] px-4 py-3 sticky top-0 z-10">
          <div className="grid grid-cols-3 items-center">
            <div>
              <h1 className="text-base font-bold text-gray-900">食事申告</h1>
              {student && (
                <p className="text-xs text-gray-500">
                  {student.name} · {student.dormitory}
                </p>
              )}
            </div>
            <div className="flex justify-center">
              <JSTClock />
            </div>
            <div className="flex justify-end">
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-xs text-gray-600 hover:text-gray-800 border border-gray-400 hover:border-gray-600 rounded-lg px-3 py-1.5 transition-colors"
                >
                  ログアウト
                </button>
              </form>
            </div>
          </div>
        </header>

        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
          <p className="text-xs text-blue-700">
            締切は各日の2日前 23:59 です。締切後は変更できません。
          </p>
        </div>

        <MealCalendar
          studentId={studentId}
          declarations={declarationMap}
          today={today}
        />
      </div>
    </div>
  )
}
