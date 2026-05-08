'use client'

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'

const ITEM_H = 44
const PAD = 2

function WheelColumn({
  items,
  selectedIndex,
  onSelect,
  format,
}: {
  items: number[]
  selectedIndex: number
  onSelect: (i: number) => void
  format: (n: number) => string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isUserScrolling = useRef(false)
  const snapTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const latestSelected = useRef(selectedIndex)
  latestSelected.current = selectedIndex

  // Set initial position synchronously before paint
  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = selectedIndex * ITEM_H
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Programmatic scroll for external changes (e.g. day clamping)
  useEffect(() => {
    if (!ref.current || isUserScrolling.current) return
    ref.current.scrollTo({ top: selectedIndex * ITEM_H, behavior: 'smooth' })
  }, [selectedIndex])

  const handleScroll = useCallback(() => {
    if (!ref.current) return
    isUserScrolling.current = true
    clearTimeout(snapTimer.current)

    const idx = Math.round(ref.current.scrollTop / ITEM_H)
    const clamped = Math.max(0, Math.min(idx, items.length - 1))
    onSelect(clamped)

    snapTimer.current = setTimeout(() => {
      isUserScrolling.current = false
      if (ref.current) {
        ref.current.scrollTo({ top: clamped * ITEM_H, behavior: 'smooth' })
      }
    }, 120)
  }, [items.length, onSelect])

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* top fade */}
      <div
        className="absolute inset-x-0 top-0 z-10 pointer-events-none"
        style={{
          height: ITEM_H * PAD,
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.9), transparent)',
        }}
      />
      {/* bottom fade */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
        style={{
          height: ITEM_H * PAD,
          background: 'linear-gradient(to top, rgba(255,255,255,0.9), transparent)',
        }}
      />
      {/* center highlight */}
      <div
        className="absolute inset-x-2 z-0 rounded-lg bg-gray-100"
        style={{ top: ITEM_H * PAD, height: ITEM_H }}
      />
      <div
        ref={ref}
        onScroll={handleScroll}
        className="relative [&::-webkit-scrollbar]:hidden"
        style={{
          height: ITEM_H * (PAD * 2 + 1),
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none',
        }}
      >
        <div style={{ height: ITEM_H * PAD }} />
        {items.map((item, i) => (
          <div
            key={item}
            style={{ height: ITEM_H, scrollSnapAlign: 'center' }}
            className={`relative z-20 flex items-center justify-center transition-all duration-100 select-none ${
              i === selectedIndex
                ? 'text-gray-900 font-semibold text-[15px]'
                : 'text-gray-400 text-sm'
            }`}
          >
            {format(item)}
          </div>
        ))}
        <div style={{ height: ITEM_H * PAD }} />
      </div>
    </div>
  )
}

export default function DateWheelPicker({
  name,
  defaultValue,
  error,
  minYear = 2000,
  maxYear = 2015,
}: {
  name: string
  defaultValue?: string
  error?: string
  minYear?: number
  maxYear?: number
}) {
  const parse = () => {
    if (defaultValue) {
      const parts = defaultValue.split('-').map(Number)
      if (parts.length === 3 && parts.every(n => !isNaN(n) && n > 0)) {
        return {
          y: Math.max(minYear, Math.min(maxYear, parts[0])),
          m: parts[1],
          d: parts[2],
        }
      }
    }
    return { y: Math.round((minYear + maxYear) / 2), m: 1, d: 1 }
  }

  const init = parse()
  const [year, setYear] = useState(init.y)
  const [month, setMonth] = useState(init.m)
  const [day, setDay] = useState(init.d)

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i)
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  const maxDay = new Date(year, month, 0).getDate()
  const days = Array.from({ length: maxDay }, (_, i) => i + 1)

  useEffect(() => {
    if (day > maxDay) setDay(maxDay)
  }, [maxDay, day])

  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  return (
    <div>
      <input type="hidden" name={name} value={dateStr} />
      <div className={`border rounded-xl overflow-hidden bg-white ${
        error ? 'border-red-400' : 'border-gray-300'
      }`}>
        <div className="flex divide-x divide-gray-100">
          <WheelColumn
            items={years}
            selectedIndex={Math.max(0, years.indexOf(year))}
            onSelect={i => setYear(years[i])}
            format={y => `${y}年`}
          />
          <WheelColumn
            items={months}
            selectedIndex={month - 1}
            onSelect={i => setMonth(months[i])}
            format={m => `${m}月`}
          />
          <WheelColumn
            items={days}
            selectedIndex={Math.min(day, maxDay) - 1}
            onSelect={i => setDay(days[i])}
            format={d => `${d}日`}
          />
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
