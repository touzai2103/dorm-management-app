'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { upsertMealDeclaration } from '@/app/actions/meals'

type DayDeclaration = { breakfast: boolean; dinner: boolean }
type Props = {
  studentId: string
  declarations: Record<string, DayDeclaration>
  today: string
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days))
  return date.toISOString().split('T')[0]
}

function isPastDeadline(dateStr: string): boolean {
  const [y, m, d] = dateStr.split('-').map(Number)
  // 締切 = 対象日の2日前 0:00 JST = UTC 15:00:00（前日）
  const deadline = new Date(Date.UTC(y, m - 1, d - 2, 15, 0, 0))
  return new Date() > deadline
}

function formatDate(dateStr: string, today: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const utcDate = new Date(Date.UTC(y, m - 1, d))
  const dayOfWeek = WEEKDAYS[utcDate.getUTCDay()]
  const isToday = dateStr === today
  const isTomorrow = dateStr === addDays(today, 1)
  const label = isToday ? '今日' : isTomorrow ? '明日' : ''
  return { label, dayOfWeek, mmdd: `${m}/${d}` }
}

function Toggle({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string
  value: boolean
  disabled: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className="flex flex-col items-center gap-1"
    >
      <span className="text-xs text-gray-500">{label}</span>
      <div
        className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
          value ? 'bg-green-500' : 'bg-gray-200'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-all duration-200 ${
            value ? 'left-7' : 'left-0.5'
          }`}
        />
      </div>
      <span
        className={`text-xs font-medium ${value ? 'text-green-600' : 'text-gray-400'}`}
      >
        {value ? '食べる' : '食べない'}
      </span>
    </button>
  )
}

export default function MealCalendar({ studentId, declarations, today }: Props) {
  const [state, setState] = useState(declarations)
  const [, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    const msUntilJSTMidnight = () => {
      const jstNow = Date.now() + 9 * 60 * 60 * 1000
      const nextMidnight = Math.ceil(jstNow / 86_400_000) * 86_400_000
      return nextMidnight - jstNow
    }
    const id = setTimeout(() => router.refresh(), msUntilJSTMidnight())
    return () => clearTimeout(id)
  }, [])

  function handleToggle(date: string, meal: 'breakfast' | 'dinner') {
    const current = state[date] ?? { breakfast: false, dinner: false }
    const updated = { ...current, [meal]: !current[meal] }
    setState(prev => ({ ...prev, [date]: updated }))
    startTransition(async () => {
      await upsertMealDeclaration(studentId, date, updated.breakfast, updated.dinner)
    })
  }

  const dates = Array.from({ length: 15 }, (_, i) => addDays(today, i))

  return (
    <div className="divide-y divide-gray-100">
      {dates.map((date, idx) => {
        const past = isPastDeadline(date)
        const decl = state[date] ?? { breakfast: false, dinner: false }
        const { label, dayOfWeek, mmdd } = formatDate(date, today)
        const isSat = dayOfWeek === '土'
        const isSun = dayOfWeek === '日'
        const dateColor = isSat ? 'text-blue-500' : isSun ? 'text-red-500' : 'text-gray-900'
        const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-[#ebe7df]'

        return (
          <div
            key={date}
            className={`px-4 py-3 ${rowBg} flex items-center justify-between ${past ? 'opacity-50' : ''}`}
          >
            <div className="w-24 shrink-0">
              <div className={`text-xl font-bold ${dateColor}`}>
                {mmdd}
                <span>({dayOfWeek})</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {label && (
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                    {label}
                  </span>
                )}
                {past && (
                  <span className="text-xs text-gray-400">締切済</span>
                )}
              </div>
            </div>
            <Toggle
              label="朝食"
              value={decl.breakfast}
              disabled={past}
              onChange={() => handleToggle(date, 'breakfast')}
            />
            <Toggle
              label="夕食"
              value={decl.dinner}
              disabled={past}
              onChange={() => handleToggle(date, 'dinner')}
            />
          </div>
        )
      })}
    </div>
  )
}
