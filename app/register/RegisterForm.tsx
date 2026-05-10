'use client'

import { useActionState, useState } from 'react'
import { registerStudent, type RegisterState } from '@/app/actions/register'

const CLUB_OPTIONS = ['無所属', '野球部', '男子バレー部', '女子バレー部', '男子バスケ部', '女子バスケ部', '弓道部', '剣道部', '教師']

const currentYear = new Date().getFullYear()
const enrollmentYears = Array.from({ length: 6 }, (_, i) => currentYear - 4 + i).reverse()

function Field({
  label,
  name,
  type = 'text',
  placeholder,
  inputMode,
  hint,
  error,
  required = true,
}: {
  label: string
  name: string
  type?: string
  placeholder?: string
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>['inputMode']
  hint?: string
  error?: string
  required?: boolean
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {hint && <p className="mb-1 text-xs text-gray-400">{hint}</p>}
      <input
        id={name}
        name={name}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        required={required}
        className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors ${
          error
            ? 'border-red-400 focus:ring-red-400'
            : 'border-gray-300 focus:ring-blue-500'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export default function RegisterForm() {
  const [state, action, pending] = useActionState<RegisterState, FormData>(
    registerStudent,
    null
  )
  const [selectedClub, setSelectedClub] = useState('')
  const isTeacher = selectedClub === '教師'

  return (
    <form action={action} className="space-y-4">
      <Field
        label="氏名"
        name="name"
        placeholder="山田 太郎"
        hint="姓と名の間に半角スペースを入力してください"
        error={state?.errors?.name}
      />
      <Field
        label="ふりがな"
        name="furigana"
        placeholder="やまだ たろう"
        error={state?.errors?.furigana}
      />
      <Field
        label="携帯番号"
        name="phone"
        type="tel"
        inputMode="tel"
        placeholder="09012345678"
        hint="ハイフン不要"
        error={state?.errors?.phone}
      />
      <div>
        <label
          htmlFor="dormitory"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          所属寮<span className="text-red-500 ml-0.5">*</span>
        </label>
        <select
          id="dormitory"
          name="dormitory"
          required
          defaultValue=""
          className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 transition-colors ${
            state?.errors?.dormitory
              ? 'border-red-400 focus:ring-red-400'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        >
          <option value="" disabled>選択してください</option>
          <option value="男子寮">男子寮</option>
          <option value="女子寮">女子寮</option>
        </select>
        {state?.errors?.dormitory && (
          <p className="mt-1 text-xs text-red-600">{state.errors.dormitory}</p>
        )}
      </div>

      <div>
        <label htmlFor="club" className="block text-sm font-medium text-gray-700 mb-1">
          部活<span className="text-red-500 ml-0.5">*</span>
        </label>
        <select
          id="club"
          name="club"
          required
          defaultValue=""
          onChange={e => setSelectedClub(e.target.value)}
          className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 transition-colors ${
            state?.errors?.club
              ? 'border-red-400 focus:ring-red-400'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        >
          <option value="" disabled>選択してください</option>
          {CLUB_OPTIONS.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {state?.errors?.club && (
          <p className="mt-1 text-xs text-red-600">{state.errors.club}</p>
        )}
      </div>

      {!isTeacher && (
        <div>
          <label
            htmlFor="enrollment_year"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            入学年度<span className="text-red-500 ml-0.5">*</span>
          </label>
          <select
            id="enrollment_year"
            name="enrollment_year"
            required
            defaultValue=""
            className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 transition-colors ${
              state?.errors?.enrollment_year
                ? 'border-red-400 focus:ring-red-400'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          >
            <option value="" disabled>
              選択してください
            </option>
            {enrollmentYears.map(y => (
              <option key={y} value={y}>
                {y}年度
              </option>
            ))}
          </select>
          {state?.errors?.enrollment_year && (
            <p className="mt-1 text-xs text-red-600">{state.errors.enrollment_year}</p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? '登録中...' : '登録する'}
      </button>
    </form>
  )
}
