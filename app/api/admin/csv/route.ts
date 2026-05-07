import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

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

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const utcDate = new Date(Date.UTC(y, m - 1, d))
  const dow = WEEKDAYS[utcDate.getUTCDay()]
  return `${m}/${d}(${dow})`
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const adminUids = (process.env.ADMIN_AUTH_UIDS ?? '')
    .split(',').map(s => s.trim()).filter(Boolean)
  if (!adminUids.includes(user.id)) return new Response('Forbidden', { status: 403 })

  const today = getJSTToday()
  const dates = Array.from({ length: 15 }, (_, i) => addDays(today, i))
  const endDate = dates[dates.length - 1]

  const admin = createAdminClient()
  const [{ data: students }, { data: declarations }] = await Promise.all([
    admin.from('students').select('id, name, dormitory').order('enrollment_year', { ascending: true }).order('furigana', { ascending: true }),
    admin.from('meal_declarations')
      .select('student_id, date, breakfast, dinner')
      .gte('date', today)
      .lte('date', endDate),
  ])

  const declMap = new Map(
    declarations?.map(d => [`${d.student_id}:${d.date}`, d]) ?? []
  )

  // ヘッダー行
  const dateHeaders = dates.flatMap(date => {
    const label = formatDateLabel(date)
    return [`${label}朝`, `${label}夕`]
  })
  const headers = ['所属寮', '氏名', ...dateHeaders]

  // データ行
  const rows = students?.map(s => {
    const cells = dates.flatMap(date => {
      const decl = declMap.get(`${s.id}:${date}`)
      return [decl?.breakfast ? '○' : '✕', decl?.dinner ? '○' : '✕']
    })
    return [s.dormitory, s.name, ...cells]
  }) ?? []

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n')

  // Excel で文字化けしないよう BOM を付与
  const bom = '﻿'
  const filename = `meal-declarations-${today}.csv`

  return new Response(bom + csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
