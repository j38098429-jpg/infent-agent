import { authServer } from '@/lib/auth/server'
import { authFailure, authJson, credentials, readBody } from '@/lib/auth/http'
import { trySyncWebsiteUser } from '@/lib/auth/sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { email, password } = credentials.parse(await readBody(request))
    const { data, error } = await authServer().auth.signInWithPassword({ email, password })
    if (error || !data.user) return authJson({ error: error?.status === 429 ? 'RATE_LIMITED' : 'LOGIN_FAILED' }, error?.status === 429 ? 429 : 400)
    await trySyncWebsiteUser(data.user.id)
    return authJson({ next: '/dashboard' })
  } catch (error) { return authFailure(error) }
}
