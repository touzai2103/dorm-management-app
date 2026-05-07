import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import RegisterForm from './RegisterForm'

export default async function RegisterPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: existing } = await supabase
    .from('student_auth_links')
    .select('id')
    .eq('auth_uid', user.id)
    .single()

  if (existing) redirect('/')

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-sm mx-auto bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">初回登録</h1>
        <p className="text-sm text-gray-500 mb-6">
          以下の情報を入力してください。
          <br />
          内容は後から管理者が確認します。
        </p>
        <RegisterForm />
      </div>
    </div>
  )
}
