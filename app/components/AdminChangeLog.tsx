const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

type Log = {
  date: string
  breakfast: boolean
  dinner: boolean
  updated_by_name: string
  updated_at: string
}

function formatDate(dateStr: string) {
  const [, m, d] = dateStr.split('-').map(Number)
  const utcDate = new Date(Date.UTC(Number(dateStr.split('-')[0]), m - 1, d))
  const dow = WEEKDAYS[utcDate.getUTCDay()]
  return `${m}/${d}（${dow}）`
}

function formatUpdatedAt(isoStr: string) {
  const jst = new Date(new Date(isoStr).getTime() + 9 * 60 * 60 * 1000)
  const m = jst.getUTCMonth() + 1
  const d = jst.getUTCDate()
  const hh = String(jst.getUTCHours()).padStart(2, '0')
  const mm = String(jst.getUTCMinutes()).padStart(2, '0')
  return `${m}/${d} ${hh}:${mm}`
}

export default function AdminChangeLog({ logs }: { logs: Log[] }) {
  if (logs.length === 0) {
    return (
      <div className="px-4 py-4 text-sm text-gray-400 text-center">
        代理変更の履歴はありません
      </div>
    )
  }

  return (
    <ul className="divide-y divide-gray-100">
      {logs.map(log => {
        return (
          <li key={log.date} className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-sm font-medium text-gray-800 shrink-0">
                {formatDate(log.date)}
              </span>
              <div className="flex gap-1.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  log.breakfast ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400 line-through'
                }`}>朝食</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  log.dinner ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400 line-through'
                }`}>夕食</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-medium text-gray-700">{log.updated_by_name}</p>
              <p className="text-xs text-gray-400">{formatUpdatedAt(log.updated_at)}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
