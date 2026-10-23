import { NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { trySyncWebsiteUser } from '@/lib/auth/sync'

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get('code')
  if (code) {
    try {
      const { data, error } = await authServer().auth.exchangeCodeForSession(code)
      if (!error && data.user) {
        await trySyncWebsiteUser(data.user.id)
        return NextResponse.redirect(new URL('/dashboard', request.url), { headers: { 'Cache-Control': 'private, no-store' } })
      }
    } catch { /* Expired links return to login without exposing the token. */ }
  }
  return NextResponse.redirect(new URL('/login?notice=confirmation-failed', request.url))
}
