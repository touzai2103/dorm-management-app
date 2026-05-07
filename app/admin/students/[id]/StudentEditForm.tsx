'use client'

import { useState, useEffect, useActionState, useTransition } from 'react'
import { updateStudent, deleteStudent, grantAdmin, revokeAdmin, type UpdateStudentState } from '@/app/actions/admin'

const currentYear = new Date().getFullYear()
const enrollmentYears = Array.from({ length: 6 }, (_, i) => currentYear - 4 + i).reverse()

type Student = {
  id: string
  name: string
  furigana: string
  phone: string
  dormitory: string
  enrollment_year: number
  birth_date: string
  room_number: string | null
}

function Field({
  label,
  name,
  defaultValue,
  type = 'text',
  placeholder,
  inputMode,
  hint,
  error,
  required = true,
}: {
  label: string
  name: string
  defaultValue?: string
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
        {!required && <span className="text-gray-400 text-xs ml-1">（任意）</span>}
      </label>
      {hint && <p className="mb-1 text-xs text-gray-400">{hint}</p>}
      <input
        id={name}
        name={name}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ''}
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

export default function StudentEditForm({
  student,
  hasAuthLink,
  isStudentAdmin,
}: {
  student: Student
  hasAuthLink: boolean
  isStudentAdmin: boolean
}) {
  const [state, action, pending] = useActionState<UpdateStudentState, FormData>(
    updateStudent,
    null
  )
  const [deleting, startDelete] = useTransition()
  const [adminPending, startAdmin] = useTransition()
  const [adminError, setAdminError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (!state?.success) return
    setShowSuccess(true)
    const id = setTimeout(() => setShowSuccess(false), 3000)
    return () => clearTimeout(id)
  }, [state])

  function handleDelete() {
    if (!window.confirm(`「${student.name}」を削除しますか？\nこの操作は元に戻せません。`)) return
    startDelete(async () => {
      await deleteStudent(student.id)
    })
  }

  function handleGrantAdmin() {
    setAdminError(null)
    startAdmin(async () => {
      const result = await grantAdmin(student.id)
      if (result?.error) setAdminError(result.error)
    })
  }

  function handleRevokeAdmin() {
    if (!window.confirm(`「${student.name}」の管理者権限を取り消しますか？`)) return
    setAdminError(null)
    startAdmin(async () => {
      const result = await revokeAdmin(student.id)
      if (result?.error) setAdminError(result.error)
    })
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="student_id" value={student.id} />

      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
          更新しました
        </div>
      )}

      <Field
        label="氏名"
        name="name"
        defaultValue={student.name}
        placeholder="山田 太郎"
        hint="姓と名の間に半角スペースを入力してください"
        error={state?.errors?.name}
      />
      <Field
        label="ふりがな"
        name="furigana"
        defaultValue={student.furigana}
        placeholder="やまだ たろう"
        error={state?.errors?.furigana}
      />
      <Field
        label="携帯番号"
        name="phone"
        type="tel"
        inputMode="tel"
        defaultValue={student.phone}
        placeholder="09012345678"
        hint="ハイフン不要"
        error={state?.errors?.phone}
      />

      <div>
        <label htmlFor="dormitory" className="block text-sm font-medium text-gray-700 mb-1">
          所属寮<span className="text-red-500 ml-0.5">*</span>
        </label>
        <select
          id="dormitory"
          name="dormitory"
          required
          defaultValue={student.dormitory}
          className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 transition-colors ${
            state?.errors?.dormitory
              ? 'border-red-400 focus:ring-red-400'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        >
          <option value="男子寮">男子寮</option>
          <option value="女子寮">女子寮</option>
        </select>
        {state?.errors?.dormitory && (
          <p className="mt-1 text-xs text-red-600">{state.errors.dormitory}</p>
        )}
      </div>

      <div>
        <label htmlFor="enrollment_year" className="block text-sm font-medium text-gray-700 mb-1">
          入学年度<span className="text-red-500 ml-0.5">*</span>
        </label>
        <select
          id="enrollment_year"
          name="enrollment_year"
          required
          defaultValue={student.enrollment_year}
          className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 transition-colors ${
            state?.errors?.enrollment_year
              ? 'border-red-400 focus:ring-red-400'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        >
          {enrollmentYears.map(y => (
            <option key={y} value={y}>{y}年度</option>
          ))}
        </select>
        {state?.errors?.enrollment_year && (
          <p className="mt-1 text-xs text-red-600">{state.errors.enrollment_year}</p>
        )}
      </div>

      <div>
        <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700 mb-1">
          生年月日<span className="text-red-500 ml-0.5">*</span>
        </label>
        <input
          id="birth_date"
          name="birth_date"
          type="date"
          required
          defaultValue={student.birth_date}
          max={new Date(Date.now() - 10 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
          min={new Date(Date.now() - 30 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
          className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors ${
            state?.errors?.birth_date
              ? 'border-red-400 focus:ring-red-400'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {state?.errors?.birth_date && (
          <p className="mt-1 text-xs text-red-600">{state.errors.birth_date}</p>
        )}
      </div>

      <Field
        label="部屋番号"
        name="room_number"
        defaultValue={student.room_number ?? ''}
        placeholder="101"
        required={false}
        error={state?.errors?.room_number}
      />

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? '更新中...' : '更新する'}
      </button>

      <div className="border-t border-gray-100 pt-4 mt-2 space-y-3">
        <p className="text-sm font-medium text-gray-700">管理者権限</p>
        {!hasAuthLink ? (
          <p className="text-xs text-gray-400">まだログインしていないため権限を変更できません</p>
        ) : isStudentAdmin ? (
          <button
            type="button"
            onClick={handleRevokeAdmin}
            disabled={adminPending}
            className="w-full border border-orange-300 text-orange-600 rounded-xl py-3 text-sm font-medium hover:bg-orange-50 active:bg-orange-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {adminPending ? '処理中...' : '管理者権限を取り消す'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleGrantAdmin}
            disabled={adminPending}
            className="w-full border border-green-300 text-green-700 rounded-xl py-3 text-sm font-medium hover:bg-green-50 active:bg-green-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {adminPending ? '処理中...' : '管理者権限を付与する'}
          </button>
        )}
        {adminError && <p className="text-xs text-red-600">{adminError}</p>}
      </div>

      <div className="border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="w-full border border-red-300 text-red-600 rounded-xl py-3 text-sm font-medium hover:bg-red-50 active:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {deleting ? '削除中...' : 'このユーザーを削除する'}
        </button>
      </div>
    </form>
  )
}
