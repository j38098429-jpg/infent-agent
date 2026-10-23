import { authServer } from '@/lib/auth/server'
import { authFailure, authJson, readBody, registration } from '@/lib/auth/http'
import { trySyncWebsiteUser } from '@/lib/auth/sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { name, email, password } = registration.parse(await readBody(request))
    const supabase = authServer()
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name }, emailRedirectTo: new URL('/auth/callback', request.url).toString() },
    })
    if (error) return authJson({ error: error.status === 429 ? 'RATE_LIMITED' : 'REGISTRATION_FAILED' }, error.status === 429 ? 429 : 400)
    // Only real rows created by Auth's trigger are eligible for synchronization.
    // A duplicate-signup obfuscated user ID has no row and creates no Softr user.
    if (data.user) await trySyncWebsiteUser(data.user.id)
    return authJson({ needsConfirmation: !data.session, next: data.session ? '/dashboard' : null })
  } catch (error) { return authFailure(error) }
}
