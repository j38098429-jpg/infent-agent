import 'server-only'
import { authAdmin } from './server'
import { SoftrUsers, type WebsiteProfile } from './softr'

export async function syncWebsiteUser(userId: string) {
  const admin = authAdmin()
  const key = process.env.SOFTR_API_KEY
  if (!key) return false // Trigger-created profile stays queued until configured.
  const { data, error } = await admin.rpc('claim_infent_softr_sync', { target_user: userId })
  if (error) throw new Error('PROFILE_SYNC_SCHEMA_UNAVAILABLE')
  const profile = data?.[0] as WebsiteProfile | undefined
  if (!profile) return true // Already synchronized, or another worker holds the lease.
  try {
    const client = new SoftrUsers(key,
      process.env.SOFTR_DATABASE_ID || '49fb0a81-0450-47e7-8a08-ecbfa8e2c082',
      process.env.SOFTR_USERS_TABLE_ID || 'O9N2m0m0P3H8pI')
    const result = await client.sync(profile)
    if ('deferred' in result) {
      await admin.rpc('release_infent_softr_sync', { target_user: userId, lease_token: profile.sync_token, error_code: 'WAITING_FOR_EMAIL_VERIFICATION' })
      return false
    }
    const { error: finishError } = await admin.rpc('finish_infent_softr_sync', {
      target_user: userId, lease_token: profile.sync_token, record_id: result.id, synced_version: profile.revision,
    })
    if (finishError) throw new Error('PROFILE_SYNC_SAVE_FAILED')
    return true
  } catch (error) {
    // Retain a short code only, never API response bodies or personal data.
    const code = error instanceof Error && /^SOFTR_[A-Z_0-9]+$/.test(error.message) ? error.message : 'SYNC_RETRY_REQUIRED'
    await admin.rpc('release_infent_softr_sync', { target_user: userId, lease_token: profile.sync_token, error_code: code })
    return false
  }
}

export async function trySyncWebsiteUser(userId: string) {
  try { return await syncWebsiteUser(userId) }
  catch { return false } // An optional dashboard outage must not invalidate a real login.
}
