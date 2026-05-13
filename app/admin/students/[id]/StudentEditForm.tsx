'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { updateStudent, deleteStudent, type UpdateStudentState } from '@/app/actions/admin'

type FieldErrors = NonNullable<NonNullable<UpdateStudentState>['errors']>

const CLUB_OPTIONS = ['無所属', '野球部', '男子バレー部', '女子バレー部', '男子バスケ部', '女子バスケ部', '弓道部', '剣道部', '教師']
const enrollmentYears = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i)

type ModalConfig = {
  title: string
  message: string
  confirmLabel: string
  danger?: boolean
  onConfirm: () => void
}

function Modal({ config, onClose }: { config: ModalConfig; onClose: () => void }) {
  return createPortal(
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
    </div>,
    document.body
  )
}

type Student = {
  id: string
  name: string
  furigana: string
  phone: string
  dormitory: string
  enrollment_year: number | null
  club: string
  room_number: string | null
}

type FieldValues = {
  name: string
  furigana: string
  phone: string
  dormitory: string
  club: string
  enrollmentYear: string
  roomNumber: string
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function PhoneCallButton({ phone }: { phone: string }) {
  return (
    <a
      href={`tel:${phone}`}
      className="md:hidden flex items-center gap-1.5 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-sm font-medium px-5 py-2 rounded-full transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 16.352V17.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" clipRule="evenodd" />
      </svg>
      架電する
    </a>
  )
}

function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  inputMode,
  hint,
  error,
  required = true,
  callLink,
}: {
  label: string
  name: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>['inputMode']
  hint?: string
  error?: string
  required?: boolean
  callLink?: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
          {!required && <span className="text-gray-400 text-xs ml-1">（任意）</span>}
        </label>
        {callLink && <PhoneCallButton phone={callLink} />}
      </div>
      {hint && <p className="mb-1 text-xs text-gray-400">{hint}</p>}
      <input
        id={name}
        name={name}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
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
}: {
  student: Student
  isViewer: boolean
}) {
  const [values, setValues] = useState<FieldValues>({
    name: student.name,
    furigana: student.furigana,
    phone: student.phone,
    dormitory: student.dormitory,
    club: student.club,
    enrollmentYear: student.enrollment_year != null ? String(student.enrollment_year) : String(new Date().getFullYear()),
    roomNumber: student.room_number ?? '',
  })
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [errors, setErrors] = useState<FieldErrors>({})
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [deleting, startDelete] = useTransition()
  const [modal, setModal] = useState<ModalConfig | null>(null)

  const isTeacher = values.club === '教師'

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [])

  function scheduleAutosave(next: FieldValues) {
    if (isViewer) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    setSaveStatus('idle')

    debounceRef.current = setTimeout(async () => {
      setSaveStatus('saving')
      const fd = new FormData()
      fd.set('student_id', student.id)
      fd.set('name', next.name)
      fd.set('furigana', next.furigana)
      fd.set('phone', next.phone)
      fd.set('dormitory', next.dormitory)
      fd.set('club', next.club)
      fd.set('enrollment_year', next.enrollmentYear)
      fd.set('room_number', next.roomNumber)

      const result = await updateStudent(null, fd)
      if (result?.success) {
        setSaveStatus('saved')
        setErrors({})
        savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2500)
      } else {
        setSaveStatus('error')
        setErrors(result?.errors ?? {})
      }
    }, 800)
  }

  function handleChange(field: keyof FieldValues, value: string) {
    const next = { ...values, [field]: value }
    setValues(next)
    scheduleAutosave(next)
  }

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

  const selectClass = (hasError?: string) =>
    `w-full border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 transition-colors disabled:bg-gray-50 disabled:text-gray-500 ${
      hasError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'
    }`

  return (
    <form onSubmit={e => e.preventDefault()} className="space-y-4">
      <input type="hidden" name="student_id" value={student.id} />

      <div className="h-5 flex items-center justify-end">
        {saveStatus === 'saving' && (
          <span className="text-xs text-gray-400">保存中...</span>
        )}
        {saveStatus === 'saved' && (
          <span className="text-xs text-green-600">保存済み ✓</span>
        )}
        {saveStatus === 'error' && Object.keys(errors).length === 0 && (
          <span className="text-xs text-red-600">保存に失敗しました</span>
        )}
      </div>

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
            value={values.name}
            onChange={v => handleChange('name', v)}
            placeholder="山田 太郎"
            hint="姓と名の間に半角スペースを入力してください"
            error={errors.name}
          />
          <Field
            label="ふりがな"
            name="furigana"
            value={values.furigana}
            onChange={v => handleChange('furigana', v)}
            placeholder="やまだ たろう"
            error={errors.furigana}
          />
          <Field
            label="携帯番号"
            name="phone"
            type="tel"
            inputMode="tel"
            value={values.phone}
            onChange={v => handleChange('phone', v)}
            placeholder="09012345678"
            hint="ハイフン不要"
            error={errors.phone}
            callLink={values.phone}
          />
          <div>
            <label htmlFor="dormitory" className="block text-sm font-medium text-gray-700 mb-1">
              所属寮<span className="text-red-500 ml-0.5">*</span>
            </label>
            <select
              id="dormitory"
              name="dormitory"
              required
              value={values.dormitory}
              onChange={e => handleChange('dormitory', e.target.value)}
              className={selectClass(errors.dormitory)}
            >
              <option value="男子寮">男子寮</option>
              <option value="女子寮">女子寮</option>
            </select>
            {errors.dormitory && (
              <p className="mt-1 text-xs text-red-600">{errors.dormitory}</p>
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
              value={values.club}
              onChange={e => handleChange('club', e.target.value)}
              className={selectClass(errors.club)}
            >
              {CLUB_OPTIONS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.club && (
              <p className="mt-1 text-xs text-red-600">{errors.club}</p>
            )}
          </div>
          {!isTeacher && (
            <div>
              <label htmlFor="enrollment_year" className="block text-sm font-medium text-gray-700 mb-1">
                入学年度<span className="text-red-500 ml-0.5">*</span>
              </label>
              <select
                id="enrollment_year"
                name="enrollment_year"
                required
                value={values.enrollmentYear}
                onChange={e => handleChange('enrollmentYear', e.target.value)}
                className={selectClass(errors.enrollment_year)}
              >
                {enrollmentYears.map(y => (
                  <option key={y} value={y}>{y}年度</option>
                ))}
              </select>
              {errors.enrollment_year && (
                <p className="mt-1 text-xs text-red-600">{errors.enrollment_year}</p>
              )}
            </div>
          )}
          <Field
            label="部屋番号"
            name="room_number"
            value={values.roomNumber}
            onChange={v => handleChange('roomNumber', v)}
            required={false}
            error={errors.room_number}
          />
        </div>
      </fieldset>

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
  const key = [
    props.student.name,
    props.student.furigana,
    props.student.phone,
    props.student.dormitory,
    props.student.enrollment_year,
    props.student.club,
    props.student.room_number,
  ].join('|')

  return (
    <StudentEditFormInner
      key={key}
      {...props}
    />
  )
}
