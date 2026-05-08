import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import MealCalendar from '@/app/components/MealCalendar'

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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 環境変数のみで判定できる場合はDBクエリ不要
  const envAdminUids = (process.env.ADMIN_AUTH_UIDS ?? '')
    .split(',').map(s => s.trim()).filter(Boolean)
  if (envAdminUids.includes(user.id)) redirect('/admin')

  // adminsテーブル確認 と authLink取得 を並列実行
  const adminClient = createAdminClient()
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

  const today = getJSTToday()
  const endDate = addDays(today, 14)

  // 寮生情報 と 申告データ を並列取得
  const [{ data: student }, { data: declarations }] = await Promise.all([
    supabase.from('students').select('name, dormitory').eq('id', authLink.student_id).single(),
    supabase.from('meal_declarations').select('date, breakfast, dinner')
      .eq('student_id', authLink.student_id)
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto">
        <header className="bg-[#ebe7df] border-b border-[#d5cfc7] px-4 py-3 sticky top-0 z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-base font-bold text-gray-900">食事申告</h1>
              {student && (
                <p className="text-xs text-gray-500">
                  {student.name} · {student.dormitory}
                </p>
              )}
            </div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              ログアウト
            </button>
          </form>
        </header>

        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
          <p className="text-xs text-blue-700">
            締切は各日の2日前 23:59 です。締切後は変更できません。
          </p>
        </div>

        <MealCalendar
          studentId={authLink.student_id}
          declarations={declarationMap}
          today={today}
        />
      </div>
    </div>
  )
}
