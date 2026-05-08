'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { isAdmin } from '@/utils/isAdmin'

export type UpdateStudentState = {
  success?: boolean
  errors?: {
    name?: string
    furigana?: string
    phone?: string
    dormitory?: string
    enrollment_year?: string
    birth_date?: string
    room_number?: string
  }
} | null

export type AdminActionState = { error?: string } | null

export type UpdateStaffState = {
  success?: boolean
  errors?: {
    name?: string
    furigana?: string
    phone?: string
  }
} | null

async function checkAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  return isAdmin(user.id)
}

export async function updateStudent(
  _prev: UpdateStudentState,
  formData: FormData
): Promise<UpdateStudentState> {
  if (!(await checkAdmin())) return { errors: { name: '権限がありません' } }

  const studentId = formData.get('student_id') as string
  const name = (formData.get('name') as string)?.trim().replace(/　/g, ' ')
  const furigana = (formData.get('furigana') as string)?.trim()
  const rawPhone = (formData.get('phone') as string) ?? ''
  const phone = rawPhone.replace(/[-\s]/g, '')
  const dormitory = (formData.get('dormitory') as string)?.trim()
  const enrollmentYearStr = (formData.get('enrollment_year') as string)?.trim()
  const birthDate = (formData.get('birth_date') as string)?.trim()
  const roomNumber = (formData.get('room_number') as string)?.trim() || null

  const errors: NonNullable<UpdateStudentState>['errors'] = {}
  const currentYear = new Date().getFullYear()

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

  if (!dormitory) {
    errors.dormitory = '所属寮を選択してください'
  } else if (dormitory !== '男子寮' && dormitory !== '女子寮') {
    errors.dormitory = '正しい所属寮を選択してください'
  }

  const enrollmentYear = parseInt(enrollmentYearStr, 10)
  if (!enrollmentYearStr) {
    errors.enrollment_year = '入学年度を選択してください'
  } else if (isNaN(enrollmentYear) || enrollmentYear < 2000 || enrollmentYear > currentYear + 1) {
    errors.enrollment_year = '正しい入学年度を選択してください'
  }

  if (!birthDate) {
    errors.birth_date = '生年月日を入力してください'
  } else {
    const birth = new Date(birthDate)
    if (isNaN(birth.getTime())) {
      errors.birth_date = '正しい日付を入力してください'
    }
  }

  if (Object.keys(errors).length > 0) return { errors }

  const admin = createAdminClient()
  const { error } = await admin
    .from('students')
    .update({
      name,
      furigana,
      phone,
      dormitory,
      enrollment_year: enrollmentYear,
      birth_date: birthDate,
      room_number: roomNumber,
    })
    .eq('id', studentId)

  if (error) {
    console.error('[admin] updateStudent error:', JSON.stringify(error))
    return { errors: { name: '更新に失敗しました。もう一度お試しください。' } }
  }

  revalidatePath('/admin')
  revalidatePath(`/admin/students/${studentId}`)
  return { success: true }
}

export async function deleteStudent(studentId: string): Promise<void> {
  if (!(await checkAdmin())) return

  const admin = createAdminClient()
  await admin.from('meal_declarations').delete().eq('student_id', studentId)
  await admin.from('student_auth_links').delete().eq('student_id', studentId)
  await admin.from('students').delete().eq('id', studentId)

  revalidatePath('/admin')
  redirect('/admin')
}

export async function updateStaff(
  _prev: UpdateStaffState,
  formData: FormData
): Promise<UpdateStaffState> {
  if (!(await checkAdmin())) return { errors: { name: '権限がありません' } }

  const authUid = formData.get('auth_uid') as string
  const name = (formData.get('name') as string)?.trim().replace(/　/g, ' ')
  const furigana = (formData.get('furigana') as string)?.trim()
  const rawPhone = (formData.get('phone') as string) ?? ''
  const phone = rawPhone.replace(/[-\s]/g, '')

  const errors: NonNullable<UpdateStaffState>['errors'] = {}

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

  const admin = createAdminClient()
  const { error } = await admin
    .from('admins')
    .update({ name, furigana, phone })
    .eq('auth_uid', authUid)

  if (error) {
    console.error('[admin] updateStaff error:', JSON.stringify(error))
    return { errors: { name: '更新に失敗しました。もう一度お試しください。' } }
  }

  revalidatePath('/admin')
  revalidatePath(`/admin/staff/${authUid}`)
  return { success: true }
}

export async function approvePendingAdmin(
  authUid: string,
  role: 'admin' | 'viewer'
): Promise<AdminActionState> {
  if (!(await checkAdmin())) return { error: '権限がありません' }

  const admin = createAdminClient()
  const { data: pending } = await admin
    .from('pending_admins')
    .select('name, furigana, phone')
    .eq('auth_uid', authUid)
    .single()

  if (!pending) return { error: '申請が見つかりません' }

  const { error } = await admin.from('admins').insert({
    auth_uid: authUid,
    role,
    name: pending.name,
    furigana: pending.furigana,
    phone: pending.phone,
  })

  if (error) {
    console.error('[admin] approvePendingAdmin error:', JSON.stringify(error))
    return { error: '承認に失敗しました' }
  }

  await admin.from('pending_admins').delete().eq('auth_uid', authUid)
  revalidatePath('/admin')
  return null
}

export async function denyPendingAdmin(authUid: string): Promise<AdminActionState> {
  if (!(await checkAdmin())) return { error: '権限がありません' }

  const admin = createAdminClient()
  await admin.from('pending_admins').delete().eq('auth_uid', authUid)
  revalidatePath('/admin')
  return null
}

export async function removeAdmin(authUid: string): Promise<AdminActionState> {
  if (!(await checkAdmin())) return { error: '権限がありません' }

  const envAdminUids = (process.env.ADMIN_AUTH_UIDS ?? '')
    .split(',').map(s => s.trim()).filter(Boolean)
  if (envAdminUids.includes(authUid)) {
    return { error: '環境変数で設定された管理者はUIから変更できません' }
  }

  const admin = createAdminClient()
  await admin.from('admins').delete().eq('auth_uid', authUid)
  revalidatePath('/admin')
  return null
}

export async function updateAdminRole(
  authUid: string,
  role: 'admin' | 'viewer'
): Promise<AdminActionState> {
  if (!(await checkAdmin())) return { error: '権限がありません' }

  const envAdminUids = (process.env.ADMIN_AUTH_UIDS ?? '')
    .split(',').map(s => s.trim()).filter(Boolean)
  if (envAdminUids.includes(authUid)) {
    return { error: '環境変数で設定された管理者はUIから変更できません' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('admins')
    .update({ role })
    .eq('auth_uid', authUid)

  if (error) {
    console.error('[admin] updateAdminRole error:', JSON.stringify(error))
    return { error: '権限の変更に失敗しました' }
  }

  revalidatePath('/admin')
  return null
}

export async function adminUpsertMealDeclaration(
  studentId: string,
  date: string,
  breakfast: boolean,
  dinner: boolean
): Promise<void> {
  if (!(await checkAdmin())) return

  const admin = createAdminClient()
  await admin.from('meal_declarations').upsert(
    { student_id: studentId, date, breakfast, dinner, updated_at: new Date().toISOString() },
    { onConflict: 'student_id,date' }
  )

  revalidatePath('/')
  revalidatePath('/admin')
  revalidatePath(`/admin/students/${studentId}`)
}
