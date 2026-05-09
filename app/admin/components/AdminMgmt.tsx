'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  approvePendingAdmin,
  denyPendingAdmin,
  type AdminActionState,
} from '@/app/actions/admin'

type PendingAdmin = {
  auth_uid: string
  name: string
  furigana: string
  phone: string
  requested_at: string
}

type ManagedAdmin = {
  auth_uid: string
  name: string | null
  furigana: string
  role: 'admin' | 'viewer'
}

type ModalState =
  | { type: 'approve'; authUid: string; name: string }
  | { type: 'deny'; authUid: string; name: string }

function ApproveModal({
  name,
  onClose,
  onApprove,
}: {
  name: string
  onClose: () => void
  onApprove: (role: 'admin' | 'viewer') => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-gray-900">承認する</h2>
        <p className="text-sm text-gray-600">「{name}」に付与する権限を選んでください</p>
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => { onClose(); onApprove('viewer') }}
            className="flex-1 py-2.5 text-sm rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            閲覧者
          </button>
          <button
            type="button"
            onClick={() => { onClose(); onApprove('admin') }}
            className="flex-1 py-2.5 text-sm rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            管理者
          </button>
        </div>
        <button type="button" onClick={onClose} className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">
          キャンセル
        </button>
      </div>
    </div>
  )
}

function ConfirmModal({
  title,
  message,
  confirmLabel,
  danger,
  onClose,
  onConfirm,
}: {
  title: string
  message: string
  confirmLabel: string
  danger?: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600">{message}</p>
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
            onClick={() => { onClose(); onConfirm() }}
            className={`flex-1 py-2.5 text-sm rounded-xl font-medium transition-colors ${
              danger
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminMgmt({
  pendingAdmins,
  managedAdmins,
  isViewer,
}: {
  pendingAdmins: PendingAdmin[]
  managedAdmins: ManagedAdmin[]
  isViewer: boolean
}) {
  const [modal, setModal] = useState<ModalState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function run(fn: () => Promise<AdminActionState>) {
    startTransition(async () => {
      setError(null)
      const result = await fn()
      if (result?.error) setError(result.error)
      else router.refresh()
    })
  }

  if (pendingAdmins.length === 0 && managedAdmins.length === 0) return null

  return (
    <>
      {pendingAdmins.length > 0 && (
        <div className="bg-[#ebe7df] rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
            <span className="text-sm font-bold text-amber-700">承認待ち</span>
            <span className="text-xs text-amber-500">{pendingAdmins.length}件</span>
          </div>
          <ul className="divide-y divide-gray-100">
            {pendingAdmins.map(p => (
              <li key={p.auth_uid} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">{p.name}</p>
                  <p className="text-xs text-gray-400 truncate">{p.furigana} · {p.phone}</p>
                </div>
                {!isViewer && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setModal({ type: 'approve', authUid: p.auth_uid, name: p.name })}
                      disabled={isPending}
                      className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
                    >
                      承認
                    </button>
                    <button
                      type="button"
                      onClick={() => setModal({ type: 'deny', authUid: p.auth_uid, name: p.name })}
                      disabled={isPending}
                      className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-60 transition-colors"
                    >
                      却下
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {managedAdmins.length > 0 && (
        <div className="bg-[#ebe7df] rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <span className="text-sm font-bold text-gray-700">スタッフ</span>
          </div>
          <ul className="divide-y divide-gray-100">
            {managedAdmins.map(a => (
              <li key={a.auth_uid}>
                <Link
                  href={`/admin/staff/${a.auth_uid}`}
                  className="px-4 py-3 flex items-center justify-between group hover:bg-white/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-800">{a.name ?? '（氏名不明）'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      a.role === 'admin'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {a.role === 'admin' ? '管理者' : '閲覧者'}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-blue-600 transition-colors group-hover:text-blue-800">
                    管理
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5">
                      <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="text-xs text-red-600 text-center px-4">{error}</p>}

      {modal?.type === 'approve' && (
        <ApproveModal
          name={modal.name}
          onClose={() => setModal(null)}
          onApprove={role => run(() => approvePendingAdmin(modal.authUid, role))}
        />
      )}
      {modal?.type === 'deny' && (
        <ConfirmModal
          title="申請を却下"
          message={`「${modal.name}」の申請を却下しますか？`}
          confirmLabel="却下する"
          danger
          onClose={() => setModal(null)}
          onConfirm={() => run(() => denyPendingAdmin(modal.authUid))}
        />
      )}

    </>
  )
}
