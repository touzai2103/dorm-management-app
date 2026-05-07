import { createAdminClient } from './supabase/admin'

export type AdminRole = 'admin' | 'viewer'

export async function getAdminRole(userId: string): Promise<AdminRole | null> {
  const adminUids = (process.env.ADMIN_AUTH_UIDS ?? '')
    .split(',').map(s => s.trim()).filter(Boolean)
  if (adminUids.includes(userId)) return 'admin'

  const admin = createAdminClient()
  const { data } = await admin
    .from('admins')
    .select('role')
    .eq('auth_uid', userId)
    .maybeSingle()
  if (!data) return null
  return data.role as AdminRole
}

export async function isAdmin(userId: string): Promise<boolean> {
  return (await getAdminRole(userId)) === 'admin'
}
