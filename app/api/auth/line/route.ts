import { NextResponse } from 'next/server'

export async function GET() {
  const state = crypto.randomUUID()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINE_CHANNEL_ID!,
    redirect_uri: `${siteUrl}/auth/callback/line`,
    state,
    scope: 'profile openid',
  })

  const response = NextResponse.redirect(
    `https://access.line.me/oauth2/v2.1/authorize?${params}`
  )
  response.cookies.set('line_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 300,
    path: '/',
  })
  return response
}
