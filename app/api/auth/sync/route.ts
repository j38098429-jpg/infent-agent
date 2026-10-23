import { authServer } from '@/lib/auth/server'
import { authFailure, authJson, sameOrigin } from '@/lib/auth/http'
import { trySyncWebsiteUser } from '@/lib/auth/sync'

export async function POST(request: Request) {
  if (!sameOrigin(request)) return authJson({ error: 'INVALID_REQUEST' }, 400)
  try {
    const { data: { user }, error } = await authServer().auth.getUser()
    if (error || !user) return authJson({ error: 'NOT_AUTHENTICATED' }, 401)
    return authJson({ synced: await trySyncWebsiteUser(user.id) })
  } catch (error) { return authFailure(error) }
}
