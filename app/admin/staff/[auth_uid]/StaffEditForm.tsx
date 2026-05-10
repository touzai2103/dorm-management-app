'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  updateStaff,
  updateAdminRole,
  removeAdmin,
  type UpdateStaffState,
} from '@/app/actions/admin'

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

type Staff = {
  auth_uid: string
  name: string
  furigana: string
  phone: string
  role: 'admin' | 'viewer'
}

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
  const router = useRouter()
  const [pending, startUpdate] = useTransition()
  const [rolePending, startRole] = useTransition()
  const [deletePending, startDelete] = useTransition()
  const [errors, setErrors] = useState<NonNullable<UpdateStaffState>['errors']>(undefined)
  const [saved, setSaved] = useState(false)
  const [roleError, setRoleError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalConfig | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startUpdate(async () => {
      const result = await updateStaff(null, formData)
      if (result?.success) {
        setErrors(undefined)
        setSaved(true)
        setTimeout(() => {
          setSaved(false)
          router.refresh()
        }, 2500)
      } else {
        setErrors(result?.errors)
      }
    })
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
          else router.refresh()
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="auth_uid" value={staff.auth_uid} />

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
              defaultValue={staff.name}
              placeholder="山田 太郎"
              required
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors disabled:bg-gray-50 disabled:text-gray-500 ${
                errors?.name ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors?.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="furigana" className="block text-sm font-medium text-gray-700 mb-1">
              ふりがな<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              id="furigana" name="furigana" type="text"
              defaultValue={staff.furigana}
              placeholder="やまだ たろう"
              required
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors disabled:bg-gray-50 disabled:text-gray-500 ${
                errors?.furigana ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors?.furigana && <p className="mt-1 text-xs text-red-600">{errors.furigana}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              携帯番号<span className="text-red-500 ml-0.5">*</span>
            </label>
            <p className="mb-1 text-xs text-gray-400">ハイフン不要</p>
            <input
              id="phone" name="phone" type="tel" inputMode="tel"
              defaultValue={staff.phone}
              placeholder="09012345678"
              required
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors disabled:bg-gray-50 disabled:text-gray-500 ${
                errors?.phone ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors?.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
          </div>
        </div>
      </fieldset>

      {!isViewer && (
        <button
          type="submit"
          disabled={pending || saved}
          className={`w-full rounded-xl py-3 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
          }`}
        >
          {pending ? '更新中...' : saved ? '✓ 更新しました' : '更新する'}
        </button>
      )}

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
