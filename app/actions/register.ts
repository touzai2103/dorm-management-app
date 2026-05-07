'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export type RegisterState = {
  errors?: {
    name?: string
    furigana?: string
    phone?: string
    dormitory?: string
    enrollment_year?: string
    birth_date?: string
  }
} | null

export async function registerStudent(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const name = (formData.get('name') as string)?.trim()
  const furigana = (formData.get('furigana') as string)?.trim()
  const rawPhone = (formData.get('phone') as string) ?? ''
  const phone = rawPhone.replace(/[-\s]/g, '')
  const dormitory = (formData.get('dormitory') as string)?.trim()
  const enrollmentYearStr = (formData.get('enrollment_year') as string)?.trim()
  const birthDate = (formData.get('birth_date') as string)?.trim()

  const errors: NonNullable<RegisterState>['errors'] = {}
  const currentYear = new Date().getFullYear()

  // 氏名（半角・全角スペースを除いた実質文字が必須）
  if (!name || name.replace(/[\s　]/g, '').length === 0) {
    errors.name = '氏名を入力してください'
  } else if (name.length > 30) {
    errors.name = '30文字以内で入力してください'
  }

  // ふりがな（ひらがな・長音符・スペースのみ）
  if (!furigana) {
    errors.furigana = 'ふりがなを入力してください'
  } else if (!/^[ぁ-んー\s　]+$/.test(furigana)) {
    errors.furigana = 'ひらがなで入力してください'
  }

  // 電話番号（ハイフン除去後 10〜11桁、先頭が 0）
  if (!phone) {
    errors.phone = '電話番号を入力してください'
  } else if (!/^0\d{9,10}$/.test(phone)) {
    errors.phone = '正しい電話番号を入力してください（例: 090-1234-5678）'
  }

  // 所属寮
  if (!dormitory) {
    errors.dormitory = '所属寮を選択してください'
  } else if (dormitory !== '男子寮' && dormitory !== '女子寮') {
    errors.dormitory = '正しい所属寮を選択してください'
  }

  // 入学年度
  const enrollmentYear = parseInt(enrollmentYearStr, 10)
  if (!enrollmentYearStr) {
    errors.enrollment_year = '入学年度を選択してください'
  } else if (isNaN(enrollmentYear) || enrollmentYear < 2000 || enrollmentYear > currentYear + 1) {
    errors.enrollment_year = '正しい入学年度を選択してください'
  }

  // 生年月日
  if (!birthDate) {
    errors.birth_date = '生年月日を入力してください'
  } else {
    const birth = new Date(birthDate)
    if (isNaN(birth.getTime())) {
      errors.birth_date = '正しい日付を入力してください'
    } else {
      const ageYears =
        (Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
      if (ageYears < 10 || ageYears > 30) {
        errors.birth_date = '正しい生年月日を入力してください'
      }
    }
  }

  if (Object.keys(errors).length > 0) return { errors }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: student, error } = await admin
    .from('students')
    .insert({
      name,
      furigana,
      phone,
      dormitory,
      enrollment_year: enrollmentYear,
      birth_date: birthDate,
    })
    .select()
    .single()

  if (error || !student) {
    console.error('[register] students insert error:', JSON.stringify(error))
    return { errors: { name: '登録に失敗しました。もう一度お試しください。' } }
  }

  const { error: linkError } = await admin.from('student_auth_links').insert({
    student_id: student.id,
    auth_uid: user.id,
    provider: (user.user_metadata?.provider as string) ?? 'line',
  })

  if (linkError) {
    console.error('[register] student_auth_links insert error:', JSON.stringify(linkError))
    await admin.from('students').delete().eq('id', student.id)
    return { errors: { name: '登録に失敗しました。もう一度お試しください。' } }
  }

  redirect('/')
}
