import { createAdminClient } from './supabase/admin'

export async function isAdmin(userId: string): Promise<boolean> {
  const adminUids = (process.env.ADMIN_AUTH_UIDS ?? '')
    .split(',').map(s => s.trim()).filter(Boolean)
  if (adminUids.includes(userId)) return true

  const admin = createAdminClient()
  const { data } = await admin
    .from('admins')
    .select('auth_uid')
    .eq('auth_uid', userId)
    .maybeSingle()
  return !!data
}
