'use client'

import { useState, useEffect, useActionState, useTransition, useRef } from 'react'
import { updateStudent, deleteStudent, type UpdateStudentState } from '@/app/actions/admin'

type ModalConfig = {
  title: string
  message: string
  confirmLabel: string
  danger?: boolean
  onConfirm: () => void
}

function Modal({ config, onClose }: { config: ModalConfig; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-gray-900">{config.title}</h2>
        <p className="text-sm text-gray-600 whitespace-pre-wrap">{config.message}</p>
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={() => { onClose(); config.onConfirm() }}
            className={`flex-1 py-2.5 text-sm rounded-xl font-medium transition-colors ${
              config.danger
                ? 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
            }`}
          >
            {config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

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
        className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors disabled:bg-gray-50 disabled:text-gray-500 ${
          error
            ? 'border-red-400 focus:ring-red-400'
            : 'border-gray-300 focus:ring-blue-500'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function StudentEditFormInner({
  student,
  isViewer,
  onSuccess,
}: {
  student: Student
  isViewer: boolean
  onSuccess: () => void
}) {
  const [state, action, pending] = useActionState<UpdateStudentState, FormData>(
    updateStudent,
    null
  )
  const [deleting, startDelete] = useTransition()
  const [modal, setModal] = useState<ModalConfig | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    const form = formRef.current
    if (!form) return
    const original = form.reset.bind(form)
    form.reset = () => {}
    return () => { form.reset = original }
  }, [])

  useEffect(() => {
    if (state?.success) onSuccess()
  }, [state])

  function handleDelete() {
    setModal({
      title: 'ユーザーを削除',
      message: `「${student.name}」を削除しますか？`,
      confirmLabel: '削除する',
      danger: true,
      onConfirm: () => {
        setModal({
          title: '本当に削除しますか？',
          message: `この操作は元に戻せません。\n本当に「${student.name}」を完全に削除してよろしいですか？`,
          confirmLabel: '完全に削除する',
          danger: true,
          onConfirm: () => {
            startDelete(async () => {
              await deleteStudent(student.id)
            })
          },
        })
      },
    })
  }

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <input type="hidden" name="student_id" value={student.id} />

      {isViewer && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500">
          閲覧専用モードです
        </div>
      )}

      <fieldset disabled={isViewer} className={isViewer ? 'opacity-70' : ''}>
        <div className="space-y-4">
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
              className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 transition-colors disabled:bg-gray-50 disabled:text-gray-500 ${
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
              className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 transition-colors disabled:bg-gray-50 disabled:text-gray-500 ${
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
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors disabled:bg-gray-50 disabled:text-gray-500 ${
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
        </div>
      </fieldset>

      {!isViewer && (
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? '更新中...' : '更新する'}
        </button>
      )}

      {!isViewer && (
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
      )}

      {modal && <Modal config={modal} onClose={() => setModal(null)} />}
    </form>
  )
}

export default function StudentEditForm(props: {
  student: Student
  isViewer: boolean
}) {
  const [showSuccess, setShowSuccess] = useState(false)

  const key = [
    props.student.name,
    props.student.furigana,
    props.student.phone,
    props.student.dormitory,
    props.student.enrollment_year,
    props.student.birth_date,
    props.student.room_number,
  ].join('|')

  return (
    <>
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 mb-4">
          更新しました
        </div>
      )}
      <StudentEditFormInner
        key={key}
        {...props}
        onSuccess={() => {
          setShowSuccess(true)
          setTimeout(() => setShowSuccess(false), 3000)
        }}
      />
    </>
  )
}
