'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type DeclRecord = Record<string, { breakfast: boolean; dinner: boolean }>

export default function StudentRows({
  students,
  declMap,
  dates,
}: {
  students: { id: string; name: string }[]
  declMap: DeclRecord
  dates: string[]
}) {
  const router = useRouter()
  const [navigatingId, setNavigatingId] = useState<string | null>(null)

  return (
    <>
      {students.map((s, idx) => {
        const isNavigating = navigatingId === s.id
        const baseRow = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
        const baseSticky = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'

        return (
          <tr
            key={s.id}
            onClick={() => {
              sessionStorage.setItem(`scroll:${window.location.pathname}`, String(window.scrollY))
              setNavigatingId(s.id)
              router.push(`/admin/students/${s.id}`)
            }}
            className={`cursor-pointer transition-all duration-150 ${
              isNavigating
                ? 'bg-gray-200 opacity-50'
                : `${baseRow} hover:bg-blue-50/40`
            }`}
          >
            <td className={`sticky left-0 z-10 border-r border-gray-100 px-3 py-2 font-medium text-gray-800 whitespace-nowrap transition-all duration-150 ${
              isNavigating ? 'bg-gray-200' : `${baseSticky} group-hover:bg-blue-50/40`
            }`}>
              {s.name}
            </td>
            {dates.map(date => {
              const decl = declMap[`${s.id}:${date}`]
              const neverTouched = decl === undefined
              return (
                <td key={date} className={`border-r border-gray-100 p-0 text-center ${neverTouched ? 'bg-amber-50' : ''}`}>
                  <div className="flex justify-center items-center w-full py-2 text-base">
                    <span className={`flex-1 text-center ${decl?.breakfast ? 'text-red-500' : 'text-gray-300'}`}>
                      {decl?.breakfast ? '●' : '✕'}
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className={`flex-1 text-center ${decl?.dinner ? 'text-red-500' : 'text-gray-300'}`}>
                      {decl?.dinner ? '●' : '✕'}
                    </span>
                  </div>
                </td>
              )
            })}
          </tr>
        )
      })}
    </>
  )
}
