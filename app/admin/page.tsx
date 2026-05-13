import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import AdminMgmt from './components/AdminMgmt'
import StudentRows from './components/StudentRows'
import AddToHomeButton from '@/app/components/AddToHomeButton'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']
const DAY_RANGE = 15
const MAX_OFFSET = 90

function getJSTToday(): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return jst.toISOString().split('T')[0]
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days))
  return date.toISOString().split('T')[0]
}

function formatDateLabel(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const utcDate = new Date(Date.UTC(y, m - 1, d))
  const dow = WEEKDAYS[utcDate.getUTCDay()]
  return { short: `${m}/${d}`, dow }
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ offset?: string }>
}) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const [{ data: { user } }, { data: dbAdmins }, { data: pendingAdmins }, resolvedParams] = await Promise.all([
    supabase.auth.getUser(),
    adminClient.from('admins').select('auth_uid, name, furigana, role'),
    adminClient.from('pending_admins')
      .select('auth_uid, name, furigana, phone, requested_at')
      .order('requested_at', { ascending: true }),
    searchParams,
  ])
  if (!user) redirect('/login')

  const envAdminUids = (process.env.ADMIN_AUTH_UIDS ?? '')
    .split(',').map(s => s.trim()).filter(Boolean)
  const dbAdminUids = dbAdmins?.map(a => a.auth_uid) ?? []
  const allAdminUids = [...new Set([...envAdminUids, ...dbAdminUids])]

  if (!allAdminUids.includes(user.id)) redirect('/')

  const isCurrentUserViewer =
    !envAdminUids.includes(user.id) &&
    dbAdmins?.find(a => a.auth_uid === user.id)?.role === 'viewer'

  const rawOffset = parseInt(resolvedParams.offset ?? '0', 10)
  const offset = isNaN(rawOffset) ? 0 : Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, rawOffset))

  const today = getJSTToday()
  const startDate = addDays(today, offset)
  const dates = Array.from({ length: DAY_RANGE }, (_, i) => addDays(startDate, i))
  const endDate = dates[dates.length - 1]

  const prevOffset = Math.max(-MAX_OFFSET, offset - DAY_RANGE)
  const nextOffset = Math.min(MAX_OFFSET, offset + DAY_RANGE)

  const [{ data: students }, { data: declarations }] = await Promise.all([
    adminClient
      .from('students')
      .select('id, name, dormitory')
      .eq('is_enrolled', true)
      .order('enrollment_year', { ascending: true })
      .order('furigana', { ascending: true }),
    adminClient
      .from('meal_declarations')
      .select('student_id, date, breakfast, dinner')
      .gte('date', startDate)
      .lte('date', endDate),
  ])

  const managedAdmins = (dbAdmins ?? [])
    .filter(a => !envAdminUids.includes(a.auth_uid))
    .map(a => ({ auth_uid: a.auth_uid, name: a.name ?? null, furigana: a.furigana ?? '', role: a.role as 'admin' | 'viewer' }))
    .sort((a, b) => {
      if (a.role !== b.role) return a.role === 'admin' ? -1 : 1
      return a.furigana.localeCompare(b.furigana, 'ja')
    })

  const declMap = new Map(
    declarations?.map(d => [`${d.student_id}:${d.date}`, d]) ?? []
  )
  const declRecord: Record<string, { breakfast: boolean; dinner: boolean }> = {}
  declarations?.forEach(d => {
    declRecord[`${d.student_id}:${d.date}`] = { breakfast: d.breakfast ?? false, dinner: d.dinner ?? false }
  })

  const allStudents = students ?? []
  const maleDorm = allStudents.filter(s => s.dormitory === '男子寮')
  const femaleDorm = allStudents.filter(s => s.dormitory === '女子寮')
  const sortedDormEntries = [
    { name: '女子寮', students: femaleDorm },
    { name: '男子寮', students: maleDorm },
  ]

  const { short: startShort } = formatDateLabel(startDate)
  const { short: endShort } = formatDateLabel(endDate)

  return (
    <div className="min-h-screen bg-[#a9b4ba] animate-page-in">
      <header className="bg-[#ebe7df] border-b border-[#d5cfc7] sticky top-0 z-20">
        <div className="px-4 py-3 flex items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-gray-900">スタッフ用画面</h1>
            {(pendingAdmins?.length ?? 0) > 0 && (
              <span className="text-xs bg-amber-500 text-white rounded-full px-2 py-0.5 font-medium">
                {pendingAdmins!.length}件承認待ち
              </span>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <AddToHomeButton />
            <a
              href="/api/admin/csv"
              className="text-xs text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
            >
              CSV出力
            </a>
          </div>
        </div>

        <div className="px-4 py-2 border-t border-[#d5cfc7]/60 flex items-center gap-2">
          {offset > -MAX_OFFSET ? (
            <Link
              href={`/admin?offset=${prevOffset}`}
              className="text-xs text-gray-600 border border-gray-300 rounded-lg px-2.5 py-1 hover:bg-white/60 transition-colors"
            >
              ← 前へ
            </Link>
          ) : (
            <span className="text-xs text-gray-300 border border-gray-200 rounded-lg px-2.5 py-1">← 前へ</span>
          )}

          <span className="flex-1 text-center text-xs text-gray-600">
            {startShort} 〜 {endShort}
            {offset !== 0 && (
              <span className="text-gray-400">（今日: {formatDateLabel(today).short}）</span>
            )}
          </span>

          {offset !== 0 && (
            <Link
              href="/admin"
              className="text-xs text-blue-600 border border-blue-200 rounded-lg px-2.5 py-1 hover:bg-blue-50 transition-colors"
            >
              今日
            </Link>
          )}

          {offset < MAX_OFFSET ? (
            <Link
              href={`/admin?offset=${nextOffset}`}
              className="text-xs text-gray-600 border border-gray-300 rounded-lg px-2.5 py-1 hover:bg-white/60 transition-colors"
            >
              次へ →
            </Link>
          ) : (
            <span className="text-xs text-gray-300 border border-gray-200 rounded-lg px-2.5 py-1">次へ →</span>
          )}
        </div>
      </header>

      <div className="px-4 pt-6 pb-4 space-y-6">
        {/* モバイルのみ表示：今日・明日のサマリー（常に今日基準） */}
        <div className="md:hidden grid grid-cols-2 gap-3">
          {[today, addDays(today, 1)].map((date, i) => {
            const { short, dow } = formatDateLabel(date)
            return (
              <div key={date} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${
                    i === 0 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {i === 0 ? '今日' : '明日'}
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <div className="text-4xl font-bold text-gray-900 leading-none">{short}</div>
                    <div className="text-sm text-gray-500 mt-1">({dow})</div>
                  </div>
                </div>
                {sortedDormEntries.map(({ name: dorm, students: dStudents }) => {
                  const bf = dStudents.filter(s => declMap.get(`${s.id}:${date}`)?.breakfast).length
                  const dn = dStudents.filter(s => declMap.get(`${s.id}:${date}`)?.dinner).length
                  return (
                    <div key={dorm} className="border-t border-gray-100 pt-3 mt-3">
                      <div className="text-xs text-gray-400 mb-2">{dorm}</div>
                      <div className="grid grid-cols-2 text-center">
                        <div>
                          <div className="text-4xl font-bold text-gray-800 leading-none">{bf}</div>
                          <div className="text-xs text-gray-400 mt-1">朝食</div>
                        </div>
                        <div>
                          <div className="text-4xl font-bold text-gray-800 leading-none">{dn}</div>
                          <div className="text-xs text-gray-400 mt-1">夕食</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {sortedDormEntries.map(({ name: dormitory, students: dStudents }) => (
          <div key={dormitory} className="bg-[#ebe7df] rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-700">{dormitory}</span>
              <span className="text-xs text-gray-400 ml-2">{dStudents.length}人</span>
            </div>

            <div className="overflow-x-auto">
              <table className="text-xs border-collapse w-full">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-gray-50 border-b border-r border-gray-100 px-3 py-2 text-left font-medium text-gray-500 min-w-[80px] w-px">
                      氏名
                    </th>
                    {dates.map(date => {
                      const { short, dow } = formatDateLabel(date)
                      const isWeekend = dow === '土' || dow === '日'
                      const isToday = date === today
                      return (
                        <th
                          key={date}
                          className={`border-b border-r border-gray-100 px-1 py-1.5 text-center font-medium min-w-[52px] ${
                            isToday
                              ? 'bg-blue-50 text-blue-600'
                              : isWeekend
                              ? 'text-blue-400'
                              : 'text-gray-500'
                          }`}
                        >
                          <div className="font-bold text-sm">{short}</div>
                          <div className="text-[10px]">({dow})</div>
                          <div className="flex justify-center gap-0.5 mt-1 text-gray-400 font-normal">
                            <span>朝</span><span>|</span><span>夕</span>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <td className="sticky left-0 z-10 bg-gray-50 border-r border-gray-200 px-3 py-2 font-bold text-gray-600 whitespace-nowrap">
                      合計
                    </td>
                    {dates.map(date => {
                      const bf = dStudents.filter(s => declMap.get(`${s.id}:${date}`)?.breakfast).length
                      const dn = dStudents.filter(s => declMap.get(`${s.id}:${date}`)?.dinner).length
                      const isToday = date === today
                      return (
                        <td key={date} className={`border-r border-gray-200 p-0 text-center ${isToday ? 'bg-blue-50/60' : ''}`}>
                          <div className="flex justify-center items-center w-full py-2 text-base">
                            <span className={`flex-1 text-center ${bf > 0 ? 'text-gray-800 font-bold' : 'text-gray-400'}`}>{bf}</span>
                            <span className="text-gray-300">|</span>
                            <span className={`flex-1 text-center ${dn > 0 ? 'text-gray-800 font-bold' : 'text-gray-400'}`}>{dn}</span>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                  <StudentRows
                    students={dStudents}
                    declMap={declRecord}
                    dates={dates}
                    today={today}
                  />
                </tbody>
              </table>
            </div>
          </div>
        ))}

        <AdminMgmt
          pendingAdmins={pendingAdmins ?? []}
          managedAdmins={managedAdmins}
          isViewer={isCurrentUserViewer ?? false}
        />
      </div>
    </div>
  )
}
