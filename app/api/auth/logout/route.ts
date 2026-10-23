import { authServer } from '@/lib/auth/server'
import { authFailure, authJson, sameOrigin } from '@/lib/auth/http'

export async function POST(request: Request) {
  if (!sameOrigin(request)) return authJson({ error: 'INVALID_REQUEST' }, 400)
  try {
    const { error } = await authServer().auth.signOut({ scope: 'local' })
    if (error) return authJson({ error: 'LOGOUT_FAILED' }, 503)
    return authJson({ next: '/login' })
  } catch (error) { return authFailure(error) }
}
