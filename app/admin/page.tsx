import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import AdminMgmt from './components/AdminMgmt'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

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

export default async function AdminPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const [{ data: { user } }, { data: dbAdmins }, { data: pendingAdmins }] = await Promise.all([
    supabase.auth.getUser(),
    adminClient.from('admins').select('auth_uid, name, role'),
    adminClient.from('pending_admins')
      .select('auth_uid, name, furigana, phone, requested_at')
      .order('requested_at', { ascending: true }),
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

  const today = getJSTToday()
  const dates = Array.from({ length: 15 }, (_, i) => addDays(today, i))
  const endDate = dates[dates.length - 1]

  const [{ data: students }, { data: declarations }] = await Promise.all([
    adminClient
      .from('students')
      .select('id, name, dormitory')
      .order('enrollment_year', { ascending: true })
      .order('furigana', { ascending: true }),
    adminClient
      .from('meal_declarations')
      .select('student_id, date, breakfast, dinner')
      .gte('date', today)
      .lte('date', endDate),
  ])

  const managedAdmins = (dbAdmins ?? [])
    .filter(a => !envAdminUids.includes(a.auth_uid))
    .map(a => ({ auth_uid: a.auth_uid, name: a.name ?? null, role: a.role as 'admin' | 'viewer' }))

  const declMap = new Map(
    declarations?.map(d => [`${d.student_id}:${d.date}`, d]) ?? []
  )

  const dormGroups: Record<string, NonNullable<typeof students>> = {}
  students?.forEach(s => {
    if (!dormGroups[s.dormitory]) dormGroups[s.dormitory] = []
    dormGroups[s.dormitory].push(s)
  })

  return (
    <div className="min-h-screen bg-[#a9b4ba]">
      <header className="bg-[#ebe7df] border-b border-[#d5cfc7] px-4 py-3 sticky top-0 z-20 flex items-center">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="ロゴ" width={28} height={28} />
          <h1 className="text-base font-bold text-gray-900">管理者画面</h1>
          {(pendingAdmins?.length ?? 0) > 0 && (
            <span className="text-xs bg-amber-500 text-white rounded-full px-2 py-0.5 font-medium">
              {pendingAdmins!.length}件承認待ち
            </span>
          )}
        </div>
        <a
          href="/api/admin/csv"
          className="ml-auto text-xs text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
        >
          CSV出力
        </a>
      </header>

      <div className="p-4 space-y-6">
        {Object.entries(dormGroups).map(([dormitory, dStudents]) => (
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
                      return (
                        <th
                          key={date}
                          className={`border-b border-r border-gray-100 px-1 py-1.5 text-center font-medium min-w-[52px] ${
                            isWeekend ? 'text-blue-400' : 'text-gray-500'
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
                      return (
                        <td key={date} className="border-r border-gray-200 p-0 text-center">
                          <div className="flex justify-center items-center w-full py-1.5 text-sm">
                            <span className={`flex-1 text-center ${bf > 0 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>{bf}</span>
                            <span className="text-gray-400">|</span>
                            <span className={`flex-1 text-center ${dn > 0 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>{dn}</span>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                  {dStudents.map((s, idx) => (
                    <tr key={s.id} className={`group transition-colors ${idx % 2 === 0 ? 'bg-white hover:bg-blue-50/40' : 'bg-gray-50/50 hover:bg-blue-50/40'}`}>
                      <td className={`sticky left-0 z-10 border-r border-gray-100 px-3 py-2 font-medium text-gray-800 whitespace-nowrap transition-colors ${
                        idx % 2 === 0 ? 'bg-white group-hover:bg-blue-50/40' : 'bg-gray-50 group-hover:bg-blue-50/40'
                      }`}>
                        <Link href={`/admin/students/${s.id}`} className="relative after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-blue-500 after:transition-all after:duration-200 hover:text-blue-600 hover:after:w-full">
                          {s.name}
                        </Link>
                      </td>
                      {dates.map(date => {
                        const decl = declMap.get(`${s.id}:${date}`)
                        return (
                          <td key={date} className="border-r border-gray-100 p-0 text-center">
                            <div className="flex justify-center items-center w-full py-1.5 text-sm">
                              <span className={`flex-1 text-center ${decl?.breakfast ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                {decl?.breakfast ? '○' : '✕'}
                              </span>
                              <span className="text-gray-400">|</span>
                              <span className={`flex-1 text-center ${decl?.dinner ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                {decl?.dinner ? '○' : '✕'}
                              </span>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
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
