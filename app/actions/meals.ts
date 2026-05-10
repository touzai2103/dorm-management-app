'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

function isPastDeadline(dateStr: string): boolean {
  const [y, m, d] = dateStr.split('-').map(Number)
  // 締切 = 対象日の2日前 0:00 JST = UTC 15:00:00（前日）
  const deadline = new Date(Date.UTC(y, m - 1, d - 2, 15, 0, 0))
  return new Date() > deadline
}

export async function upsertMealDeclaration(
  studentId: string,
  date: string,
  breakfast: boolean,
  dinner: boolean
) {
  if (isPastDeadline(date)) return

  // ログインユーザーの確認と studentId の所有権チェック
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: authLink } = await supabase
    .from('student_auth_links')
    .select('student_id')
    .eq('auth_uid', user.id)
    .eq('student_id', studentId)
    .single()

  if (!authLink) return

  // admin クライアントで RLS をバイパスして upsert
  const admin = createAdminClient()
  const { error } = await admin
    .from('meal_declarations')
    .upsert(
      { student_id: studentId, date, breakfast, dinner, updated_at: new Date().toISOString() },
      { onConflict: 'student_id,date' }
    )

  if (error) {
    console.error('[meals] upsert error:', JSON.stringify(error))
    return
  }

  revalidatePath('/')
  revalidatePath('/admin')
}
