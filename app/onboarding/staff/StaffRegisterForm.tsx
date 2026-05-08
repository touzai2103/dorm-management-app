'use client'

import { useActionState } from 'react'
import { registerStaff, type RegisterStaffState } from '@/app/actions/register-staff'

function Field({
  label,
  name,
  type = 'text',
  placeholder,
  inputMode,
  hint,
  error,
}: {
  label: string
  name: string
  type?: string
  placeholder?: string
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>['inputMode']
  hint?: string
  error?: string
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}<span className="text-red-500 ml-0.5">*</span>
      </label>
      {hint && <p className="mb-1 text-xs text-gray-400">{hint}</p>}
      <input
        id={name}
        name={name}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        required
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

export default function StaffRegisterForm() {
  const [state, action, pending] = useActionState<RegisterStaffState, FormData>(
    registerStaff,
    null
  )

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
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? '申請中...' : '申請する'}
      </button>
    </form>
  )
}
