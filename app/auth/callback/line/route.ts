import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const storedState = request.cookies.get('line_oauth_state')?.value

  console.log('[LINE callback] code:', !!code, 'state match:', state === storedState, 'storedState:', !!storedState)

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(`${origin}/login?error=invalid_state`)
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

  // LINEのコードをアクセストークンに交換
  const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${siteUrl}/auth/callback/line`,
      client_id: process.env.LINE_CHANNEL_ID!,
      client_secret: process.env.LINE_CHANNEL_SECRET!,
    }),
  })

  const lineTokens = await tokenRes.json()
  console.log('[LINE callback] token response:', lineTokens.access_token ? 'OK' : lineTokens.error)
  if (!lineTokens.access_token) {
    return NextResponse.redirect(`${origin}/login?error=line_token_error`)
  }

  // LINEユーザー情報を取得
  const profileRes = await fetch('https://api.line.me/v2/profile', {
    headers: { Authorization: `Bearer ${lineTokens.access_token}` },
  })
  const lineProfile = await profileRes.json()
  const { userId: lineUserId, displayName } = lineProfile

  if (!lineUserId) {
    return NextResponse.redirect(`${origin}/login?error=line_profile_error`)
  }

  const syntheticEmail = `line_${lineUserId}@line.local`
  const supabaseAdmin = createAdminClient()

  // マジックリンクを生成（ユーザーが存在しなければ自動作成）
  // redirectTo に /auth/callback を指定 → Supabase がコードを発行してリダイレクト
  const { data: linkData, error: linkError } =
    await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: syntheticEmail,
      options: {
        redirectTo: `${origin}/auth/line-complete`,
      },
    })

  console.log('[LINE callback] generateLink:', linkError ? linkError.message : 'OK', 'action_link:', !!linkData?.properties?.action_link)
  if (linkError || !linkData?.properties?.action_link) {
    return NextResponse.redirect(`${origin}/login?error=session_error`)
  }

  // LINEユーザー情報をメタデータに保存
  await supabaseAdmin.auth.admin.updateUserById(linkData.user.id, {
    user_metadata: {
      provider: 'line',
      line_id: lineUserId,
      display_name: displayName,
    },
  })

  // Supabase の検証URLへリダイレクト
  // Supabase がトークンを検証し /auth/callback?code=... へ転送してくれる
  const response = NextResponse.redirect(linkData.properties.action_link)
  response.cookies.delete('line_oauth_state')
  return response
}
