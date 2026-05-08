'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export type RegisterStaffState = {
  errors?: {
    name?: string
    furigana?: string
    phone?: string
  }
} | null

export async function registerStaff(
  _prev: RegisterStaffState,
  formData: FormData
): Promise<RegisterStaffState> {
  const name = (formData.get('name') as string)?.trim().replace(/　/g, ' ')
  const furigana = (formData.get('furigana') as string)?.trim()
  const rawPhone = (formData.get('phone') as string) ?? ''
  const phone = rawPhone.replace(/[-\s]/g, '')

  const errors: NonNullable<RegisterStaffState>['errors'] = {}

  if (!name || name.replace(/[\s　]/g, '').length === 0) {
    errors.name = '氏名を入力してください'
  } else if (name.length > 30) {
    errors.name = '30文字以内で入力してください'
  }

  if (!furigana) {
    errors.furigana = 'ふりがなを入力してください'
  } else if (!/^[ぁ-んー\s　]+$/.test(furigana)) {
    errors.furigana = 'ひらがなで入力してください'
  }

  if (!phone) {
    errors.phone = '電話番号を入力してください'
  } else if (!/^0\d{9,10}$/.test(phone)) {
    errors.phone = '正しい携帯番号を入力してください（例: 09012345678）'
  }

  if (Object.keys(errors).length > 0) return { errors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { error } = await admin.from('pending_admins').upsert(
    { auth_uid: user.id, name, furigana, phone },
    { onConflict: 'auth_uid' }
  )

  if (error) {
    console.error('[register-staff] error:', JSON.stringify(error))
    return { errors: { name: '申請に失敗しました。もう一度お試しください。' } }
  }

  redirect('/pending')
}
