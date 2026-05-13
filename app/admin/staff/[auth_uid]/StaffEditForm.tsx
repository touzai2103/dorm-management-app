'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  updateStaff,
  updateAdminRole,
  removeAdmin,
  type UpdateStaffState,
} from '@/app/actions/admin'

type FieldErrors = NonNullable<NonNullable<UpdateStaffState>['errors']>

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

type Staff = {
  auth_uid: string
  name: string
  furigana: string
  phone: string
  role: 'admin' | 'viewer'
}

type FieldValues = {
  name: string
  furigana: string
  phone: string
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const ROLE_OPTIONS: { value: 'admin' | 'viewer'; label: string }[] = [
  { value: 'viewer', label: '閲覧者' },
  { value: 'admin', label: '管理者' },
]

function StaffEditFormInner({
  staff,
  isViewer,
}: {
  staff: Staff
  isViewer: boolean
}) {
  const [values, setValues] = useState<FieldValues>({
    name: staff.name,
    furigana: staff.furigana,
    phone: staff.phone,
  })
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [errors, setErrors] = useState<FieldErrors>({})
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [rolePending, startRole] = useTransition()
  const [deletePending, startDelete] = useTransition()
  const [roleError, setRoleError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalConfig | null>(null)

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
      fd.set('auth_uid', staff.auth_uid)
      fd.set('name', next.name)
      fd.set('furigana', next.furigana)
      fd.set('phone', next.phone)

      const result = await updateStaff(null, fd)
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

  function handleSetRole(role: 'admin' | 'viewer') {
    if (role === staff.role) return
    const label = role === 'admin' ? '管理者' : '閲覧者'
    setModal({
      title: '権限を変更',
      message: `「${staff.name}」の権限を「${label}」に変更しますか？`,
      confirmLabel: '変更する',
      onConfirm: () => {
        setRoleError(null)
        startRole(async () => {
          const result = await updateAdminRole(staff.auth_uid, role)
          if (result?.error) setRoleError(result.error)
        })
      },
    })
  }

  function handleDelete() {
    setModal({
      title: 'スタッフを削除',
      message: `「${staff.name}」を削除しますか？`,
      confirmLabel: '削除する',
      danger: true,
      onConfirm: () => {
        setModal({
          title: '本当に削除しますか？',
          message: `この操作は元に戻せません。\n本当に「${staff.name}」を削除してよろしいですか？`,
          confirmLabel: '完全に削除する',
          danger: true,
          onConfirm: () => {
            startDelete(async () => {
              await removeAdmin(staff.auth_uid)
            })
          },
        })
      },
    })
  }

  const inputClass = (hasError?: string) =>
    `w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors disabled:bg-gray-50 disabled:text-gray-500 ${
      hasError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'
    }`

  return (
    <form onSubmit={e => e.preventDefault()} className="space-y-4">
      <input type="hidden" name="auth_uid" value={staff.auth_uid} />

      {saveStatus === 'saving' && (
        <div className="flex justify-end">
          <span className="text-xs text-gray-400">保存中...</span>
        </div>
      )}
      {saveStatus === 'saved' && (
        <div className="flex justify-end">
          <span className="text-xs text-green-600">保存済み ✓</span>
        </div>
      )}
      {saveStatus === 'error' && Object.keys(errors).length === 0 && (
        <div className="flex justify-end">
          <span className="text-xs text-red-600">保存に失敗しました</span>
        </div>
      )}

      {isViewer && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500">
          閲覧専用モードです
        </div>
      )}

      <fieldset disabled={isViewer} className={isViewer ? 'opacity-70' : ''}>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              氏名<span className="text-red-500 ml-0.5">*</span>
            </label>
            <p className="mb-1 text-xs text-gray-400">姓と名の間に半角スペースを入力してください</p>
            <input
              id="name" name="name" type="text"
              value={values.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="山田 太郎"
              required
              className={inputClass(errors.name)}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="furigana" className="block text-sm font-medium text-gray-700 mb-1">
              ふりがな<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              id="furigana" name="furigana" type="text"
              value={values.furigana}
              onChange={e => handleChange('furigana', e.target.value)}
              placeholder="やまだ たろう"
              required
              className={inputClass(errors.furigana)}
            />
            {errors.furigana && <p className="mt-1 text-xs text-red-600">{errors.furigana}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                携帯番号<span className="text-red-500 ml-0.5">*</span>
              </label>
              <a
                href={`tel:${values.phone}`}
                className="md:hidden flex items-center gap-1.5 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-sm font-medium px-5 py-2 rounded-full transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 16.352V17.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" clipRule="evenodd" />
                </svg>
                架電する
              </a>
            </div>
            <p className="mb-1 text-xs text-gray-400">ハイフン不要</p>
            <input
              id="phone" name="phone" type="tel" inputMode="tel"
              value={values.phone}
              onChange={e => handleChange('phone', e.target.value)}
              placeholder="09012345678"
              required
              className={inputClass(errors.phone)}
            />
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
          </div>
        </div>
      </fieldset>

      <div className="border-t border-gray-100 pt-4 space-y-3">
        <div className="flex gap-2">
          {ROLE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleSetRole(value)}
              disabled={isViewer || rolePending || staff.role === value}
              className={`flex-1 py-3 text-sm rounded-xl border transition-colors font-medium ${
                staff.role === value
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'border-gray-200 text-gray-600 hover:bg-orange-50'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {label}
            </button>
          ))}
        </div>
        {roleError && <p className="text-xs text-red-600">{roleError}</p>}
      </div>

      {!isViewer && (
        <div className="border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deletePending}
            className="w-full bg-red-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-red-700 active:bg-red-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {deletePending ? '削除中...' : 'このスタッフを削除する'}
          </button>
        </div>
      )}

      {modal && <Modal config={modal} onClose={() => setModal(null)} />}
    </form>
  )
}

export default function StaffEditForm(props: { staff: Staff; isViewer: boolean }) {
  const key = [props.staff.name, props.staff.furigana, props.staff.phone, props.staff.role].join('|')

  return (
    <StaffEditFormInner
      key={key}
      {...props}
    />
  )
}
