import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { authConfigured, authConfig } from '@/lib/auth/config'

export async function middleware(request: NextRequest) {
  const target = new URL('/login', request.url)
  if (!authConfigured()) return NextResponse.redirect(target)
  let response = NextResponse.next({ request })
  const { url, key } = authConfig()
  const supabase = createServerClient(url, key, {
    cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: values => {
        values.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      const redirect = NextResponse.redirect(target)
      response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie))
      return redirect
    }
  } catch { return NextResponse.redirect(target) }
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}

export const config = { matcher: ['/dashboard/:path*', '/account/:path*'] }
