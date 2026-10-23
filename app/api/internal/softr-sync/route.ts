import { timingSafeEqual } from 'node:crypto'
import { authAdmin } from '@/lib/auth/server'
import { authJson } from '@/lib/auth/http'
import { trySyncWebsiteUser } from '@/lib/auth/sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return authJson({ error: 'NOT_CONFIGURED' }, 503)
  const supplied = Buffer.from(request.headers.get('authorization') || '')
  const expected = Buffer.from(`Bearer ${secret}`)
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return authJson({ error: 'UNAUTHORIZED' }, 401)
  try {
    const { data, error } = await authAdmin().rpc('pending_infent_softr_sync')
    if (error) return authJson({ error: 'QUEUE_UNAVAILABLE' }, 503)
    let synced = 0
    let attempted = 0
    const started = Date.now()
    for (const row of data || []) {
      if (Date.now() - started > 15000) break
      attempted++
      if (await trySyncWebsiteUser(row.auth_user_id)) synced++
    }
    return authJson({ attempted, synced })
  } catch { return authJson({ error: 'SYNC_UNAVAILABLE' }, 503) }
}
